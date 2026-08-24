"""커밋 평가 서비스 — 명료성·정합성·원자성·컨벤션의 6점 평가."""

import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from fnmatch import fnmatchcase
from pathlib import PurePosixPath
from typing import Optional
from urllib.parse import quote

import requests
from django.conf import settings
from django.db import connection

from repository.models import GithubCommitAiEvaluation, GithubCommitFileSummaryCache
from . import llm_client
from .readme_code_analyzer import sanitize_text

logger = logging.getLogger(__name__)

_CONVENTION_RE = re.compile(
    r'^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)'
    r'(\([^)]+\))?:',
    re.IGNORECASE,
)
_CONVENTION_PREFIX_RE = re.compile(
    r'^\s*([a-z][a-z0-9_-]*)(?:\([^)]+\))?:', re.IGNORECASE
)
_STANDARD_TYPE_WITHOUT_COLON_RE = re.compile(
    r'^\s*(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)'
    r'(?:\([^)]+\))?(?:\s+|$)',
    re.IGNORECASE,
)
_NONSTANDARD_CONVENTION_ALIASES = {
    'feature': 'feat',
    'bugfix': 'fix',
    'hotfix': 'fix',
}
_MERGE_COMMIT_RE = re.compile(r'^\s*merge\b', re.IGNORECASE)
_PB2_RE = re.compile(r'.*_pb2(?:_grpc)?\.py$', re.IGNORECASE)
_PB_GO_RE = re.compile(r'.*\.pb\.go$', re.IGNORECASE)
_MIGRATION_RE = re.compile(
    r'(?:^|/)(?:migrations?|db/migrate)/'
    r'(?:\d{4}[^/]*\.(?:py|rb|sql|js|ts)|V\d+__[^/]+\.sql)$',
    re.IGNORECASE,
)
_GENERATED_DIRS = {
    'dist', 'build', 'out', 'node_modules', 'vendor',
    '__pycache__', '__snapshots__', '.pytest_cache', '.mypy_cache',
    '.idea', '.vscode',
}
_LOCK_NAMES = {'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'gemfile.lock'}
_GENERATED_SUFFIXES = (
    '.min.js', '.min.css', '.pyc', '.pyo', '.class', '.o', '.snap',
)
_GENERATED_NAMES = {'.ds_store'}
_MAX_ATOMICITY_FILES = 30
_MAX_COMPLETE_COMMIT_FILES = 300
_MERGE_SKIP_REASON = '머지 커밋은 평가 대상이 아닙니다.'
_FILE_LIMIT_SKIP_REASON = '변경 파일이 300개 이상인 커밋은 평가 대상이 아닙니다.'


def _normalize_path(filename: str) -> str:
    normalized = filename.replace('\\', '/')
    while normalized.startswith('./'):
        normalized = normalized[2:]
    return normalized.lstrip('/')


def _isoformat(value):
    return value.isoformat() if hasattr(value, 'isoformat') else value


def _is_merge_commit(message_headline: str) -> bool:
    """Git이 생성하는 일반적인 Merge ... 제목을 판별한다."""
    return bool(_MERGE_COMMIT_RE.match(message_headline or ''))


def _merge_skip_result(commit: dict, updated_at=None) -> dict:
    return {
        **commit,
        'evaluated': True,
        'evaluation_status': 'skipped',
        'is_merge_commit': True,
        'skip_reason': _MERGE_SKIP_REASON,
        'model_name': None,
        'commit_score': None,
        'commit_total_score': None,
        'commit_max_score': None,
        'commit_full_max_score': 6,
        'is_provisional': False,
        'commit_breakdown': {
            'evaluation_status': 'skipped',
            'is_merge_commit': True,
            'skip_reason': _MERGE_SKIP_REASON,
        },
        'commit_strengths': [],
        'commit_improvements': [],
        'commit_advice': [],
        'commit_missing': [],
        'updated_at': _isoformat(updated_at),
    }


def _file_limit_skip_result(commit: dict, file_count: int, updated_at=None) -> dict:
    return {
        **commit,
        'evaluated': True,
        'evaluation_status': 'skipped',
        'is_merge_commit': False,
        'is_file_limit_exceeded': True,
        'file_count': file_count,
        'skip_reason': _FILE_LIMIT_SKIP_REASON,
        'model_name': None,
        'commit_score': None,
        'commit_total_score': None,
        'commit_max_score': None,
        'commit_full_max_score': 6,
        'is_provisional': False,
        'commit_breakdown': {
            'evaluation_status': 'skipped',
            'is_file_limit_exceeded': True,
            'file_count': file_count,
            'skip_reason': _FILE_LIMIT_SKIP_REASON,
        },
        'commit_strengths': [],
        'commit_improvements': [],
        'commit_advice': [],
        'commit_missing': [],
        'updated_at': _isoformat(updated_at),
    }


def _save_skipped_evaluation(entity, breakdown: dict) -> None:
    entity.model_name = None
    entity.commit_score = None
    entity.commit_total_score = None
    entity.message_clarity_score = None
    entity.consistency_score = None
    entity.atomicity_score = None
    entity.convention_score = None
    entity.commit_breakdown = breakdown
    entity.commit_strengths = []
    entity.commit_improvements = []
    entity.commit_advice = []
    entity.commit_missing = []
    entity.save()


def _get_commit(github_username: str, repo_name: str, sha: str) -> Optional[dict]:
    sql = """
        SELECT
            gc.sha,
            gc.message,
            gc.message_body,
            COALESCE(gc.author_github, ga.github_login_username),
            gc.author_date,
            gc.committer_date,
            gc.addition,
            gc.deletion
        FROM github_commit gc
        JOIN github_repository gr ON gc.repo_id = gr.id
        LEFT JOIN github_account ga ON gc.github_id = ga.github_id
        WHERE gr.owner_name = %s
          AND gr.repo_name = %s
          AND gc.sha = %s
        LIMIT 1
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [github_username, repo_name, sha])
        row = cursor.fetchone()
    if not row:
        return None
    return {
        'sha': row[0],
        'message': row[1] or '',
        'message_body': row[2] or '',
        'author': row[3],
        'author_date': _isoformat(row[4]),
        'committer_date': _isoformat(row[5]),
        'date': _isoformat(row[5]),
        'additions': row[6],
        'deletions': row[7],
    }


def get_commit_list(github_username: str, repo_name: str) -> list[dict]:
    """저장소의 수집된 커밋과 제목·본문을 최신순으로 반환한다."""
    sql = """
        SELECT
            gc.sha,
            gc.message,
            gc.message_body,
            COALESCE(gc.author_github, ga.github_login_username),
            gc.author_date,
            gc.committer_date,
            gc.addition,
            gc.deletion
        FROM github_commit gc
        JOIN github_repository gr ON gc.repo_id = gr.id
        LEFT JOIN github_account ga ON gc.github_id = ga.github_id
        WHERE gr.owner_name = %s
          AND gr.repo_name = %s
        ORDER BY gc.committer_date DESC, gc.id DESC
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [github_username, repo_name])
        rows = cursor.fetchall()

    return [
        {
            'sha': sha,
            'message': message or '',
            'message_body': message_body or '',
            'author': author,
            'author_date': _isoformat(author_date),
            'committer_date': _isoformat(committer_date),
            'date': _isoformat(committer_date),
            'additions': additions,
            'deletions': deletions,
            'is_merge_commit': _is_merge_commit(message),
        }
        for (
            sha, message, message_body, author, author_date,
            committer_date, additions, deletions,
        ) in rows
    ]


def get_commit_counts(repositories: list[tuple[str, str]]) -> dict[str, int]:
    if not repositories:
        return {}
    conditions = ' OR '.join(
        ['(gr.owner_name = %s AND gr.repo_name = %s)'] * len(repositories)
    )
    params = [value for repository in repositories for value in repository]
    sql = f"""
        SELECT gr.owner_name, gr.repo_name, COUNT(gc.id)
        FROM github_repository gr
        LEFT JOIN github_commit gc ON gc.repo_id = gr.id
        WHERE {conditions}
        GROUP BY gr.owner_name, gr.repo_name
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        rows = cursor.fetchall()
    return {f'{owner}/{repo}': count for owner, repo, count in rows}


def _is_generated_file(filename: str) -> bool:
    normalized = _normalize_path(filename)
    path = PurePosixPath(normalized)
    lower_parts = {part.lower() for part in path.parts}
    basename = path.name.lower()
    lower = normalized.lower()
    return bool(
        basename in _LOCK_NAMES
        or basename in _GENERATED_NAMES
        or basename.endswith('.lock')
        or lower_parts.intersection(_GENERATED_DIRS)
        or lower.endswith(_GENERATED_SUFFIXES)
        or fnmatchcase(basename, 'analysis-snapshot.*')
        or _PB2_RE.fullmatch(lower)
        or _PB_GO_RE.fullmatch(lower)
        or _MIGRATION_RE.search(normalized)
    )


def _linguist_generated_patterns(files: list[dict]) -> list[str]:
    """변경된 .gitattributes에서 linguist-generated=true 패턴을 읽는다."""
    patterns = []
    for file in files:
        if PurePosixPath(str(file.get('filename') or '')).name != '.gitattributes':
            continue
        for line in str(file.get('patch') or '').splitlines():
            if not line or line.startswith(('---', '+++', '@@', '-')):
                continue
            content = line[1:] if line[0] in {'+', ' '} else line
            parts = content.strip().split()
            if len(parts) >= 2 and any(
                attr.lower() in {'linguist-generated', 'linguist-generated=true'}
                for attr in parts[1:]
            ):
                patterns.append(parts[0].lstrip('/'))
    return patterns


def _matches_generated_pattern(filename: str, patterns: list[str]) -> bool:
    normalized = _normalize_path(filename)
    basename = PurePosixPath(normalized).name
    return any(
        fnmatchcase(normalized, pattern) if '/' in pattern
        else fnmatchcase(basename, pattern)
        for pattern in patterns
    )


def _split_generated_files(files: list[dict]) -> tuple[list[dict], list[dict]]:
    generated, human_authored = [], []
    linguist_patterns = _linguist_generated_patterns(files)
    for file in files:
        filename = str(file.get('filename') or '')
        is_generated = (
            _is_generated_file(filename)
            or _matches_generated_pattern(filename, linguist_patterns)
        )
        target = generated if is_generated else human_authored
        target.append(file)
    return generated, human_authored


def _evaluate_convention(message_headline: str) -> tuple[int, str, str]:
    """Conventional Commits를 판정하고 기계적으로 확정 가능한 근거를 반환한다."""
    headline = message_headline or ''
    standard_match = _CONVENTION_RE.match(headline)
    if standard_match:
        prefix = standard_match.group(1).lower()
        return (
            1,
            'satisfied',
            f"표준 Conventional Commits 타입 접두사 '{prefix}:'을 사용했습니다.",
        )

    prefix_match = _CONVENTION_PREFIX_RE.match(headline)
    if prefix_match:
        prefix = prefix_match.group(1).lower()
        recommended = _NONSTANDARD_CONVENTION_ALIASES.get(prefix)
        if recommended:
            return (
                0,
                'unsatisfied',
                f"'{prefix}'는 표준이 아닙니다. '{recommended}:'을 권장합니다.",
            )
        return (
            0,
            'unsatisfied',
            f"'{prefix}'는 표준 Conventional Commits 타입이 아닙니다. "
            "'feat:', 'fix:' 등의 표준 타입을 사용해 주세요.",
        )

    missing_colon_match = _STANDARD_TYPE_WITHOUT_COLON_RE.match(headline)
    if missing_colon_match:
        prefix = missing_colon_match.group(1).lower()
        return (
            0,
            'unsatisfied',
            f"타입 '{prefix}' 뒤에 콜론이 없습니다. '{prefix}:' 형식을 사용해 주세요.",
        )

    return (
        0,
        'unsatisfied',
        "타입 접두사(feat:, fix: 등)가 없습니다.",
    )


def _compute_convention_score(message_headline: str) -> int:
    """기존 호출부와 테스트를 위한 점수 전용 래퍼."""
    return _evaluate_convention(message_headline)[0]


def _compute_message_clarity_score(result: llm_client.CommitMessageClarityResult) -> int:
    if result.what != 'satisfied':
        return 0
    return 2 if result.why == 'satisfied' else 1


def _merge_convention_feedback(
    sentences: llm_client.CommitSentenceResponse,
    convention_score: int,
    convention_reason: str,
) -> tuple[list[str], list[str]]:
    """LLM을 거치지 않은 컨벤션 고정 문구를 최종 피드백에 합친다."""
    strengths = list(sentences.strengths or [])
    improvements = list(sentences.improvements or [])
    target = strengths if convention_score else improvements
    target.append(convention_reason)
    return strengths, improvements


def _to_grade(total: float) -> str:
    """N/A 여부와 무관하게 커밋의 고정 6점 척도로 등급을 정한다."""
    if total >= 5.0:
        return 'A+'
    if total >= 3.5:
        return 'A'
    if total >= 2.0:
        return 'B'
    if total >= 1.0:
        return 'C'
    return 'D'


def _diff_url(owner: str, repo: str, sha: str) -> str:
    parts = '/'.join(quote(part, safe='') for part in (owner, repo, sha))
    return f"{settings.SPRING_BACKEND_URL.rstrip('/')}/api/v1/github/commits/{parts}/diff"


def _fetch_commit_files(owner: str, repo: str, sha: str) -> list[dict]:
    response = requests.get(_diff_url(owner, repo, sha), timeout=30)
    response.raise_for_status()
    payload = response.json()
    files = payload.get('files') or []
    if not isinstance(files, list):
        raise ValueError('Spring diff API의 files 응답 형식이 올바르지 않습니다.')
    return [file for file in files if isinstance(file, dict) and file.get('filename')]


def _evaluate_atomicity(
    repo_name: str,
    sha: str,
    headline: str,
    body: str,
    source_files: list[dict],
) -> tuple[Optional[int], str, str, Optional[str], float]:
    """(점수, 상태, 근거, 실제 모델, LLM 비용)을 반환한다."""
    if not source_files:
        return (
            None,
            'N/A',
            '직접 작성한 소스 코드 변경이 없어 원자성을 평가하지 않았습니다.',
            None,
            0.0,
        )
    if len(source_files) == 1:
        return 1, 'satisfied', '사람이 작성한 변경 파일이 1개여서 하나의 관심사로 판정했습니다.', None, 0.0
    if len(source_files) > _MAX_ATOMICITY_FILES:
        return (
            None,
            'N/A',
            f'직접 변경한 파일이 {len(source_files)}개로 너무 많아 한 가지 작업에 '
            '집중한 커밋인지 정확히 판단하기 어려워 평가하지 않았습니다.',
            None,
            0.0,
        )

    source_names = [str(file['filename']) for file in source_files]
    result = llm_client.score_commit_atomicity(
        repo_name, sha, headline, body, source_names
    )
    llm_client.log_judgment(
        f'{repo_name}@{sha[:8]} | Commit',
        'atomicity',
        result.result,
        result.reason,
        result.actual_model,
    )
    score = 1 if result.result == 'satisfied' else 0
    return (
        score, result.result, result.reason, result.actual_model,
        result.actual_cost,
    )


def _build_patch_text(source_files: list[dict]) -> tuple[str, int]:
    """patch가 실제로 제공된 소스 파일만 원문 그대로 하나의 입력으로 묶는다."""
    blocks = []
    for file in source_files:
        patch = file.get('patch')
        if not isinstance(patch, str) or not patch.strip():
            continue
        blocks.append(
            "\n".join([
                f"=== FILE: {file['filename']} ===",
                f"status={file.get('status') or 'unknown'}, "
                f"additions={file.get('additions', 'unknown')}, "
                f"deletions={file.get('deletions', 'unknown')}",
                patch,
            ])
        )
    return "\n\n".join(blocks), len(blocks)


def _evaluate_consistency(
    repo_name: str,
    sha: str,
    headline: str,
    body: str,
    clarity: llm_client.CommitMessageClarityResult,
    source_files: list[dict],
) -> tuple[Optional[int], str, str, Optional[str], int, int, float]:
    """(점수, 상태, 근거, 실제 모델, patch 토큰 수, patch 파일 수, LLM 비용)."""
    if clarity.what != 'satisfied':
        return (
            None, 'N/A',
            '커밋 메시지만으로는 무엇을 변경했는지 알기 어려워 실제 코드와의 '
            '일치 여부를 평가하지 않았습니다.',
            None, 0, 0, 0.0,
        )

    patch_text, patch_file_count = _build_patch_text(source_files)
    if not patch_text:
        return (
            None, 'N/A',
            '비교할 수 있는 소스 코드 변경 내용이 없어 메시지와 코드의 일치 여부를 '
            '평가하지 않았습니다.',
            None, 0, 0, 0.0,
        )

    patch_injection_hits = llm_client.scan_injection(patch_text)
    if patch_injection_hits:
        logger.warning(
            'Commit patch 인젝션 패턴 감지: %s@%s → %s',
            repo_name, sha[:7], patch_injection_hits,
        )

    patch_tokens = llm_client.count_text_tokens(
        patch_text, model=llm_client.COMMIT_CONSISTENCY_MODEL
    )
    token_limit = settings.COMMIT_CONSISTENCY_MAX_TOKENS
    if patch_tokens > token_limit:
        return (
            None,
            'N/A',
            f'코드 변경 내용이 너무 커서 메시지와 코드의 일치 여부를 정확히 평가하기 '
            f'어렵습니다({patch_tokens:,}/{token_limit:,}토큰). 커밋을 더 작은 단위로 '
            '나누면 평가받을 수 있습니다.',
            None,
            patch_tokens,
            patch_file_count,
            0.0,
        )

    result = llm_client.score_commit_consistency(
        repo_name, sha, headline, body, patch_text
    )
    llm_client.log_judgment(
        f'{repo_name}@{sha[:8]} | Commit',
        'consistency',
        result.result,
        result.reason,
        result.actual_model,
    )
    scores = {'matched': 2, 'partially_matched': 1, 'mismatched': 0}
    return (
        scores[result.result], result.result, result.reason, result.actual_model,
        patch_tokens, patch_file_count, result.actual_cost,
    )


def _normalize_file_summary(summary: str) -> str:
    """화면 표시용으로 모델 응답을 한 줄로 정리한다."""
    normalized = ' '.join((summary or '').split()).strip()
    return normalized or '변경 내용을 patch만으로 파악하기 어렵습니다.'


def _summarize_single_file(repo_name: str, sha: str, file: dict) -> tuple[str, dict]:
    filename = str(file['filename'])
    patch = str(file['patch'])
    injection_hits = llm_client.scan_injection(filename + '\n' + patch)
    if injection_hits:
        logger.warning(
            'Commit 파일 요약 인젝션 패턴 감지: %s@%s %s → %s',
            repo_name, sha[:7], filename, injection_hits,
        )
    safe_filename = sanitize_text(filename, '커밋 요약 파일 경로')
    result = llm_client.summarize_commit_file(
        repo_name, sha, safe_filename, patch
    )
    return filename, {
        'status': 'summarized',
        'summary': _normalize_file_summary(result.summary),
    }


def get_or_create_file_summaries(
    github_username: str,
    repo_name: str,
    sha: str,
) -> dict:
    """파일별 표시용 요약을 캐시에서 읽거나 독립적으로 병렬 생성한다."""
    commit = _get_commit(github_username, repo_name, sha)
    if not commit:
        raise ValueError(f'커밋을 찾을 수 없습니다: {github_username}/{repo_name}@{sha}')
    if _is_merge_commit(commit['message']):
        return {
            'sha': sha,
            'summaries': {},
            'cache_hit': False,
            'skip_reason': _MERGE_SKIP_REASON,
        }

    try:
        cache = GithubCommitFileSummaryCache.objects.get(
            github_id=github_username, repo_name=repo_name, sha=sha
        )
        return {
            'sha': sha,
            'summaries': cache.summaries or {},
            'cache_hit': True,
            'updated_at': _isoformat(cache.updated_at),
        }
    except GithubCommitFileSummaryCache.DoesNotExist:
        pass

    files = _fetch_commit_files(github_username, repo_name, sha)
    generated_files, source_files = _split_generated_files(files)
    generated_names = {str(file['filename']) for file in generated_files}
    source_names = {str(file['filename']) for file in source_files}
    summaries = {}
    jobs = []

    for file in files:
        filename = str(file['filename'])
        patch = file.get('patch')
        if filename in generated_names:
            summaries[filename] = {
                'status': 'generated',
                'summary': '자동 생성 파일이라 요약하지 않았습니다.',
            }
            continue
        if filename not in source_names or not isinstance(patch, str) or not patch.strip():
            summaries[filename] = {
                'status': 'unavailable',
                'summary': '변경 내용을 표시할 수 없습니다(파일이 너무 크거나 바이너리일 수 있습니다).',
            }
            continue

        patch_tokens = llm_client.count_text_tokens(
            patch, model=llm_client.COMMIT_FILE_SUMMARY_MODEL
        )
        if patch_tokens > settings.COMMIT_FILE_SUMMARY_MAX_TOKENS:
            summaries[filename] = {
                'status': 'too_large',
                'summary': '이 파일의 변경 내용이 너무 커서 요약하지 않았습니다.',
            }
            continue
        jobs.append(file)

    if jobs:
        configured_workers = settings.COMMIT_FILE_SUMMARY_MAX_WORKERS
        max_workers = (
            len(jobs) if configured_workers <= 0
            else max(1, min(len(jobs), configured_workers))
        )
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(_summarize_single_file, repo_name, sha, file): file
                for file in jobs
            }
            for future in as_completed(futures):
                filename = str(futures[future]['filename'])
                try:
                    result_filename, entry = future.result()
                    summaries[result_filename] = entry
                except Exception as error:
                    logger.error(
                        'Commit 파일 요약 실패: %s/%s@%s %s - %s',
                        github_username, repo_name, sha[:7], filename, error,
                    )
                    summaries[filename] = {
                        'status': 'error',
                        'summary': '파일 변경 요약을 생성하지 못했습니다.',
                    }

    cache, _ = GithubCommitFileSummaryCache.objects.update_or_create(
        github_id=github_username,
        repo_name=repo_name,
        sha=sha,
        defaults={'summaries': summaries},
    )
    return {
        'sha': sha,
        'summaries': summaries,
        'cache_hit': False,
        'updated_at': _isoformat(cache.updated_at),
    }


def get_evaluation(github_username: str, repo_name: str, sha: str) -> dict:
    commit = _get_commit(github_username, repo_name, sha)
    if not commit:
        raise ValueError(f'커밋을 찾을 수 없습니다: {github_username}/{repo_name}@{sha}')
    if _is_merge_commit(commit['message']):
        return _merge_skip_result(commit)
    try:
        entity = GithubCommitAiEvaluation.objects.get(
            github_id=github_username, repo_name=repo_name, sha=sha
        )
        try:
            files = _fetch_commit_files(github_username, repo_name, sha)
        except requests.RequestException as error:
            logger.warning(
                '기존 커밋 평가의 파일 목록 조회 실패: %s/%s@%s - %s',
                github_username, repo_name, sha[:7], error,
            )
            files = []
        if len(files) >= _MAX_COMPLETE_COMMIT_FILES:
            return _file_limit_skip_result(
                commit,
                len(files),
                updated_at=entity.updated_at,
            )
        return _entity_to_dict(entity, commit=commit, files=files)
    except GithubCommitAiEvaluation.DoesNotExist:
        return {**commit, 'evaluated': False}


def evaluate(github_username: str, repo_name: str, sha: str) -> dict:
    commit = _get_commit(github_username, repo_name, sha)
    if not commit:
        raise ValueError(f'커밋을 찾을 수 없습니다: {github_username}/{repo_name}@{sha}')

    raw_headline = commit['message']
    raw_body = commit['message_body']
    if _is_merge_commit(raw_headline):
        entity, _ = GithubCommitAiEvaluation.objects.get_or_create(
            github_id=github_username, repo_name=repo_name, sha=sha
        )
        breakdown = {
            'evaluation_status': 'skipped',
            'is_merge_commit': True,
            'skip_reason': _MERGE_SKIP_REASON,
        }
        _save_skipped_evaluation(entity, breakdown)
        logger.info(
            '머지 커밋 평가 제외: %s/%s@%s',
            github_username, repo_name, sha[:7],
        )
        return _merge_skip_result(commit, updated_at=entity.updated_at)

    injection_hits = llm_client.scan_injection(raw_headline + '\n' + raw_body)
    if injection_hits:
        logger.warning(
            'Commit 인젝션 패턴 감지: %s/%s@%s → %s',
            github_username, repo_name, sha[:7], injection_hits,
        )
    headline = sanitize_text(raw_headline, '커밋 메시지 제목')
    body = sanitize_text(raw_body, '커밋 메시지 본문')
    files = _fetch_commit_files(github_username, repo_name, sha)
    if len(files) >= _MAX_COMPLETE_COMMIT_FILES:
        entity, _ = GithubCommitAiEvaluation.objects.get_or_create(
            github_id=github_username, repo_name=repo_name, sha=sha
        )
        breakdown = {
            'evaluation_status': 'skipped',
            'is_file_limit_exceeded': True,
            'file_count': len(files),
            'skip_reason': _FILE_LIMIT_SKIP_REASON,
        }
        _save_skipped_evaluation(entity, breakdown)
        logger.info(
            '변경 파일 300개 이상 커밋 평가 제외: %s/%s@%s',
            github_username, repo_name, sha[:7],
        )
        return _file_limit_skip_result(
            commit,
            len(files),
            updated_at=entity.updated_at,
        )
    generated_files, source_files = _split_generated_files(files)
    raw_source_names = [str(file['filename']) for file in source_files]
    file_injection_hits = llm_client.scan_injection('\n'.join(raw_source_names))
    if file_injection_hits:
        logger.warning(
            'Commit 파일명 인젝션 패턴 감지: %s/%s@%s → %s',
            github_username, repo_name, sha[:7], file_injection_hits,
        )
    source_names = [sanitize_text(name, '커밋 파일 경로') for name in raw_source_names]
    scoring_source_files = [
        {**file, 'filename': sanitized_name}
        for file, sanitized_name in zip(source_files, source_names)
    ]

    convention_score, convention_status, convention_reason = _evaluate_convention(
        headline
    )
    message_result = llm_client.score_commit_message(
        repo_name, sha, headline, body
    )
    message_clarity = message_result.message_clarity
    llm_client.log_judgment(
        f'{github_username}/{repo_name}@{sha[:8]} | Commit',
        'message_what',
        message_clarity.what,
        message_clarity.what_reason,
        message_result.actual_model,
    )
    llm_client.log_judgment(
        f'{github_username}/{repo_name}@{sha[:8]} | Commit',
        'message_why',
        message_clarity.why,
        message_clarity.why_reason,
        message_result.actual_model,
    )
    message_clarity_score = _compute_message_clarity_score(
        message_clarity
    )

    (
        atomicity_score,
        atomicity_status,
        atomicity_reason,
        atomicity_model,
        atomicity_cost,
    ) = _evaluate_atomicity(repo_name, sha, headline, body, scoring_source_files)

    (
        consistency_score,
        consistency_status,
        consistency_reason,
        consistency_model,
        consistency_patch_tokens,
        consistency_patch_file_count,
        consistency_cost,
    ) = _evaluate_consistency(
        repo_name,
        sha,
        headline,
        body,
        message_result.message_clarity,
        scoring_source_files,
    )

    total = (
        message_clarity_score
        + convention_score
        + (atomicity_score or 0)
        + (consistency_score or 0)
    )
    max_score = 6
    good_items, bad_items = _build_sentence_inputs(
        message_result.message_clarity,
        atomicity_status,
        atomicity_reason,
        consistency_status,
        consistency_reason,
    )
    sentences = llm_client.write_commit_sentences(
        repo_name, sha, headline, body, source_names, good_items, bad_items
    )
    total_llm_cost = sum((
        message_result.actual_cost,
        atomicity_cost,
        consistency_cost,
        sentences.actual_cost,
    ))
    # 컨벤션은 판정과 안내가 모두 기계적이므로 LLM 문장화 결과에 직접 삽입한다.
    strengths, improvements = _merge_convention_feedback(
        sentences, convention_score, convention_reason
    )

    scoring_models = [message_result.actual_model]
    if atomicity_model and atomicity_model not in scoring_models:
        scoring_models.append(atomicity_model)
    if consistency_model and consistency_model not in scoring_models:
        scoring_models.append(consistency_model)

    entity, _ = GithubCommitAiEvaluation.objects.get_or_create(
        github_id=github_username, repo_name=repo_name, sha=sha
    )
    entity.model_name = ', '.join(scoring_models)
    entity.commit_score = _to_grade(total)
    entity.commit_total_score = total
    entity.message_clarity_score = message_clarity_score
    entity.consistency_score = consistency_score
    entity.atomicity_score = atomicity_score
    entity.convention_score = convention_score
    entity.commit_breakdown = {
        'message_clarity': message_clarity_score,
        'message_clarity_what_status': message_result.message_clarity.what,
        'message_clarity_what_reason': message_result.message_clarity.what_reason,
        'message_clarity_why_status': message_result.message_clarity.why,
        'message_clarity_why_reason': message_result.message_clarity.why_reason,
        'consistency': consistency_score,
        'atomicity': atomicity_score,
        'convention': convention_score,
        'convention_status': convention_status,
        'convention_reason': convention_reason,
        'atomicity_status': atomicity_status,
        'atomicity_reason': atomicity_reason,
        'consistency_status': consistency_status,
        'consistency_reason': consistency_reason,
        'consistency_patch_tokens': consistency_patch_tokens,
        'consistency_token_limit': settings.COMMIT_CONSISTENCY_MAX_TOKENS,
        'file_summary': {
            'source_file_count': len(source_files),
            'generated_file_count': len(generated_files),
            'consistency_patch_file_count': consistency_patch_file_count,
        },
    }
    entity.commit_strengths = strengths
    entity.commit_improvements = improvements
    entity.commit_advice = sentences.advice or []
    # 커밋 화면에서는 improvements와 중복되는 별도 누락 항목을 제공하지 않는다.
    entity.commit_missing = []
    entity.save()

    logger.info(
        '커밋 평가 완료: %s/%s@%s → %d/%d점 (%s) '
        '(명료성%d + 정합성%s + 원자성%s + 컨벤션%d)',
        github_username, repo_name, sha[:7], total, max_score, entity.commit_score,
        message_clarity_score,
        'N/A' if consistency_score is None else consistency_score,
        'N/A' if atomicity_score is None else atomicity_score,
        convention_score,
    )
    logger.info(
        '[LLM 총 비용] %s/%s@%s | Commit 평가 | total=$%.6f '
        '| 메시지=$%.6f | 원자성=$%.6f | 정합성=$%.6f | 문장화=$%.6f',
        github_username,
        repo_name,
        sha[:7],
        total_llm_cost,
        message_result.actual_cost,
        atomicity_cost,
        consistency_cost,
        sentences.actual_cost,
    )
    return _entity_to_dict(
        entity,
        commit=commit,
        files=files,
        generated_files=[file['filename'] for file in generated_files],
    )


def _build_sentence_inputs(
    clarity: llm_client.CommitMessageClarityResult,
    atomicity_status: str,
    atomicity_reason: str,
    consistency_status: str,
    consistency_reason: str,
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    good, bad = [], []
    (good if clarity.what == 'satisfied' else bad).append({
        'label': '무엇을 변경했는지 파악 가능한 커밋 제목',
        'reason': clarity.what_reason,
    })
    (good if clarity.why == 'satisfied' else bad).append({
        'label': '변경 이유와 배경 설명',
        'reason': clarity.why_reason,
    })
    if atomicity_status == 'satisfied':
        good.append({
            'label': '하나의 논리적 변경에 집중한 파일 구성',
            'reason': atomicity_reason,
        })
    elif atomicity_status == 'unsatisfied':
        bad.append({
            'label': '무관한 관심사를 분리한 원자적 커밋 구성',
            'reason': atomicity_reason,
        })
    if consistency_status == 'matched':
        good.append({
            'label': '커밋 메시지와 실제 변경 방향의 일치',
            'reason': consistency_reason,
        })
    elif consistency_status in {'partially_matched', 'mismatched'}:
        bad.append({
            'label': '커밋 메시지가 실제 변경의 행위·대상·범위를 정확히 설명하도록 보완',
            'reason': consistency_reason,
        })
    elif '더 작은 단위로 나누면' in consistency_reason:
        bad.append({
            'label': '정합성을 평가할 수 있도록 더 작은 단위로 나눈 커밋',
            'reason': consistency_reason,
        })
    return good, bad


def _entity_to_dict(
    entity: GithubCommitAiEvaluation,
    commit: Optional[dict] = None,
    files: Optional[list[dict]] = None,
    generated_files: Optional[list[str]] = None,
) -> dict:
    breakdown = entity.commit_breakdown or {}
    is_provisional = 'consistency_status' not in breakdown
    max_score = 6
    display_grade = (
        _to_grade(entity.commit_total_score)
        if entity.commit_total_score is not None
        else entity.commit_score
    )
    result = {
        'evaluated': True,
        'sha': entity.sha,
        'model_name': entity.model_name,
        # 과거 N/A 축을 분모에서 제외해 저장한 등급도 고정 6점 기준으로 보정한다.
        'commit_score': display_grade,
        'commit_total_score': entity.commit_total_score,
        'commit_max_score': max_score,
        'commit_full_max_score': 6,
        'is_provisional': is_provisional,
        'commit_breakdown': breakdown,
        'commit_breakdown_max': {
            'message_clarity': 2,
            'consistency': 2,
            'atomicity': 1,
            'convention': 1,
        },
        'commit_strengths': entity.commit_strengths,
        'commit_improvements': entity.commit_improvements,
        'commit_advice': entity.commit_advice,
        # 이전 평가 레코드에 값이 남아 있어도 API에서는 더 이상 노출하지 않는다.
        'commit_missing': [],
        'updated_at': entity.updated_at.isoformat() if entity.updated_at else None,
    }
    if commit:
        result.update(commit)
    if files is not None:
        result['files'] = files
    if generated_files is not None:
        result['generated_files'] = generated_files
    return result
