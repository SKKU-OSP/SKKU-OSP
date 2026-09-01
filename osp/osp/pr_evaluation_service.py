"""PR 평가 서비스 — 텍스트 6점 + 정합성 2점 + 응집성 1점."""
from concurrent.futures import ThreadPoolExecutor
import logging
import re
import uuid
from contextvars import copy_context
from typing import Callable, Optional
from urllib.parse import quote

import requests
from django.conf import settings
from django.db import connection

from repository.models import GithubPulls, GithubPrAiEvaluation
from .readme_code_analyzer import sanitize_text
from . import commit_evaluation_service as commit_service
from . import llm_client

logger = logging.getLogger(__name__)

_PR_CONSISTENCY_MIN_REMAINING_TOKENS = 500
_PR_COHESION_MIN_REMAINING_TOKENS = 500

# ── PR 목록 조회 ──────────────────────────────────────────────────

def get_pr_list(github_username: str, repo_name: str) -> list:
    pulls = (
        GithubPulls.objects
        .filter(owner_id=github_username, repo_name=repo_name)
        .order_by('-date')
        .values('number', 'github_id', 'title', 'date')
    )
    return [
        {
            'pr_number': p['number'],
            'author': p['github_id'],
            'title': p['title'],
            'date': p['date'].isoformat() if p['date'] else None,
        }
        for p in pulls
    ]


# ── PR 본문 조회 ──────────────────────────────────────────────────

def _get_pr_body(github_username: str, repo_name: str, pr_number: int) -> Optional[str]:
    sql = """
        SELECT gpr.pr_body
        FROM github_pull_request gpr
        JOIN github_repository gr ON gpr.repo_id = gr.id
        WHERE gr.owner_name = %s
          AND gr.repo_name  = %s
          AND gpr.pr_number = %s
        LIMIT 1
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [github_username, repo_name, pr_number])
        row = cursor.fetchone()
    return row[0] if row else None


# ── 평가 조회 ─────────────────────────────────────────────────────

def get_evaluation(github_username: str, repo_name: str, pr_number: int) -> dict:
    pr_body = _get_pr_body(github_username, repo_name, pr_number)
    try:
        entity = GithubPrAiEvaluation.objects.get(
            github_id=github_username, repo_name=repo_name, pr_number=pr_number
        )
        return _entity_to_dict(entity, pr_body)
    except GithubPrAiEvaluation.DoesNotExist:
        return {'pr_body': pr_body, 'evaluated': False}


# ── 보너스 판정 (코드 정규식) ─────────────────────────────────────

_RE_ISSUE = re.compile(
    # 단독 #숫자는 PR 참조일 수도 있으므로 인정하지 않는다.
    r'\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+\b'
    r'|github\.com/[\w.-]+/[\w.-]+/issues/\d+',
    re.IGNORECASE,
)
_RE_CODE_BLOCK = re.compile(r'```.*?```', re.DOTALL)
_RE_CONVENTION = re.compile(
    r'^(feat|fix|docs|refactor|test|chore|style|perf|ci|build|revert)(\(.+\))?:\s',
    re.IGNORECASE,
)
_RE_KR_CONVENTION = re.compile(r'^\[[^\]]+\]')
_RE_IMAGE = re.compile(r'!\[|<img', re.IGNORECASE)
_RE_CHECKLIST = re.compile(r'- \[[xX]\][ \t]*\S+')


def _has_substantial_code_block(body: str) -> bool:
    """비어있지 않은 줄이 2줄 이상인 코드블록이 있으면 True."""
    for m in _RE_CODE_BLOCK.finditer(body):
        inner = m.group(0)[3:-3]  # 앞뒤 ``` 제거
        non_empty = [l for l in inner.splitlines() if l.strip()]
        if len(non_empty) >= 2:
            return True
    return False


def _compute_bonus(pr_title: str, pr_body: str) -> tuple:
    """(bonus_score: float, earned_items: list[str]) 반환. 최대 2.0점."""
    title = pr_title or ''
    body = pr_body or ''
    # 코드 블록 내 #\d+ 오탐 방지
    body_no_code = _RE_CODE_BLOCK.sub('', body)
    full_text = title + ' ' + body_no_code

    bonus = 0.0
    earned = []

    if _RE_ISSUE.search(full_text):
        bonus += 1.0
        earned.append('이슈 연결')

    if _RE_CONVENTION.match(title) or _RE_KR_CONVENTION.match(title):
        bonus += 0.5
        earned.append('커밋 컨벤션')

    if _RE_IMAGE.search(body) or _has_substantial_code_block(body) or _RE_CHECKLIST.search(body):
        bonus += 0.5
        earned.append('리뷰 보조자료')

    return min(bonus, 2.0), earned


# ── 점수 계산 (코드) ──────────────────────────────────────────────

def _compute_fulfilment_score(f: llm_client.PrFulfilmentResult) -> int:
    """충실도 0~3점. What이 unsatisfied면 0점 고정."""
    if f.what != 'satisfied':
        return 0
    why_ok = f.why == 'satisfied'
    ver_ok = f.verification == 'satisfied'
    if why_ok and ver_ok:
        return 3
    if why_ok or ver_ok:
        return 2
    return 1


def _compute_clarity_score(c: llm_client.PrClarityResult) -> int:
    """명료성 0~1점. 판정 가능한 신호 중 하나라도 unsatisfied이면 0점.
    single_focus는 diff 없이 텍스트만으로 오판 가능성이 높아 점수에서 제외하고 조언 용도로만 사용.
    """
    signals = [c.title_specificity, c.title_body_match]
    judgeable = [s for s in signals if s != 'N/A']
    if not judgeable:
        logger.warning("명료성 신호 전부 N/A — title_specificity가 N/A로 반환된 LLM 오류 가능성. 0점 처리.")
        return 0
    return 1 if all(s == 'satisfied' for s in judgeable) else 0


def _to_grade(total: float, max_score: float = 9.0) -> str:
    """9점 등급컷을 적용한다. 실제 PR 평가는 항상 고정 9점 만점을 사용한다."""
    normalized = total / max_score * 9 if max_score else 0
    if normalized >= 7.5:
        return 'A+'
    if normalized >= 5.0:
        return 'A'
    if normalized >= 3.0:
        return 'B'
    if normalized >= 1.5:
        return 'C'
    return 'D'


# ── PR 정합성 ReAct 에이전트 ─────────────────────────────────────

def _pr_commits_url(owner: str, repo: str, pr_number: int) -> str:
    parts = '/'.join(quote(part, safe='') for part in (owner, repo))
    return (
        f"{settings.SPRING_BACKEND_URL.rstrip('/')}"
        f"/api/v1/github/pulls/{parts}/{pr_number}/commits"
    )


def list_pr_commits(owner: str, repo: str, pr_number: int) -> list[dict]:
    """Tool 1: PR 커밋 메타데이터 목록만 가져온다."""
    response = requests.get(_pr_commits_url(owner, repo, pr_number), timeout=30)
    response.raise_for_status()
    payload = response.json()
    commits = payload.get('commits') or []
    if not isinstance(commits, list):
        raise ValueError('Spring PR 커밋 목록 API 응답 형식이 올바르지 않습니다.')

    normalized = []
    for commit in commits:
        if not isinstance(commit, dict) or not commit.get('sha'):
            continue
        normalized.append({
            'sha': str(commit['sha']),
            'message_headline': str(commit.get('messageHeadline') or ''),
            'file_count': commit.get('fileCount'),
            'additions': int(commit.get('additions') or 0),
            'deletions': int(commit.get('deletions') or 0),
        })
    return normalized


def fetch_commit_diff(owner: str, repo: str, sha: str) -> list[dict]:
    """Tool 2: 기존 커밋 평가와 같은 Spring API로 원본 diff를 가져온다."""
    return commit_service._fetch_commit_files(owner, repo, sha)


def _agent_observation(sha: str, status: str, message: str, patch: str = '') -> dict:
    observation = {'sha': sha, 'status': status, 'message': message}
    if patch:
        observation['patch'] = patch
    return observation


def _build_commit_trace(
    commits: list[dict],
    observations: list[dict],
    summaries: Optional[list] = None,
) -> list[dict]:
    """원본 patch를 제외한 사용자 표시·디버깅용 커밋 처리 내역."""
    summary_by_sha = {
        item.sha: ' '.join(item.summary.split())
        for item in (summaries or [])
        if item.sha
    }
    valid_shas = {commit['sha'] for commit in commits}
    observation_by_sha: dict[str, dict] = {}
    for observation in observations:
        sha = observation.get('sha')
        if not sha or sha not in valid_shas:
            continue
        current = observation_by_sha.get(sha)
        # 중복 요청은 이미 기록된 실제 처리 결과(success/스킵/실패)를 덮지 않는다.
        if current and observation.get('status') == 'duplicate':
            continue
        observation_by_sha[sha] = observation

    trace = []
    for commit in commits:
        sha = commit['sha']
        observation = observation_by_sha.get(sha)
        trace.append({
            **commit,
            'status': observation.get('status') if observation else 'not_selected',
            'status_reason': observation.get('message') if observation else '에이전트가 확인 대상으로 선택하지 않았습니다.',
            'summary': summary_by_sha.get(sha),
        })
    return trace


def _run_pr_consistency_agent(
    owner: str,
    repo_name: str,
    pr_number: int,
    pr_title: str,
    pr_body: str,
    commits: Optional[list[dict]] = None,
) -> dict:
    """LLM이 필요한 커밋 diff를 고르는 ReAct 루프를 실행한다."""
    run_id = uuid.uuid4().hex
    max_iterations = max(1, settings.PR_CONSISTENCY_MAX_ITERATIONS)
    token_limit = max(1, settings.PR_CONSISTENCY_MAX_TOKENS)
    logger.info(
        '[PR 정합성 에이전트] run_id=%s 시작 | %s/%s#%d | max_iterations=%d | token_limit=%d',
        run_id, owner, repo_name, pr_number, max_iterations, token_limit,
    )

    if commits is None:
        try:
            commits = list_pr_commits(owner, repo_name, pr_number)
        except Exception as error:
            reason = 'PR에 포함된 커밋 목록을 가져오지 못해 변경 정합성을 평가하지 않았습니다.'
            logger.warning(
                '[PR 정합성 에이전트] run_id=%s list_pr_commits 실패: %s', run_id, error
            )
            return {
                'score': None, 'status': 'N/A', 'reason': reason, 'run_id': run_id,
                'examined_commits': [], 'attempted_commits': [], 'patch_tokens': 0,
                'stop_reason': 'list_pr_commits_failed', 'actual_models': [],
                'commits': [], 'llm_cost': 0.0,
            }

    if not commits:
        return {
            'score': None, 'status': 'N/A',
            'reason': 'PR에 포함된 커밋이 없어 변경 정합성을 평가하지 않았습니다.',
            'run_id': run_id, 'examined_commits': [], 'attempted_commits': [],
            'patch_tokens': 0, 'stop_reason': 'empty_commit_list', 'actual_models': [],
            'commits': [], 'llm_cost': 0.0,
        }

    commit_by_sha = {commit['sha']: commit for commit in commits}
    observations: list[dict] = []
    seen: set[str] = set()
    attempted: list[str] = []
    examined: list[str] = []
    actual_models: list[str] = []
    llm_cost = 0.0
    cumulative_tokens = 0
    stop_reason = 'max_iterations'

    logger.info(
        '[PR 정합성 에이전트] run_id=%s list_pr_commits 관찰 | commits=%d',
        run_id, len(commits),
    )
    commit_injection_hits = llm_client.scan_injection(
        '\n'.join(commit['message_headline'] for commit in commits)
    )
    if commit_injection_hits:
        logger.warning(
            '[PR 정합성 에이전트] run_id=%s 커밋 목록 인젝션 패턴 감지: %s',
            run_id, commit_injection_hits,
        )

    for iteration in range(1, max_iterations + 1):
        remaining_tokens = token_limit - cumulative_tokens
        if remaining_tokens < _PR_CONSISTENCY_MIN_REMAINING_TOKENS:
            stop_reason = 'budget_exhausted'
            logger.info(
                '[PR 정합성 에이전트] run_id=%s 남은 토큰 예산 부족 | remaining=%d threshold=%d',
                run_id, remaining_tokens, _PR_CONSISTENCY_MIN_REMAINING_TOKENS,
            )
            break

        decision = llm_client.choose_pr_consistency_action(
            repo_name, pr_number, pr_title, pr_body, commits, observations,
            remaining_iterations=max_iterations - iteration + 1,
            remaining_tokens=max(0, remaining_tokens),
        )
        llm_cost += decision.actual_cost
        if decision.actual_model:
            actual_models.append(decision.actual_model)
        logger.info(
            '[PR 정합성 에이전트] run_id=%s iteration=%d 판단 | action=%s | sha=%s | reason=%s | model=%s',
            run_id, iteration, decision.action, decision.sha or '-',
            re.sub(r'\s+', ' ', decision.reason), decision.actual_model or 'unknown',
        )

        if decision.action == 'finish':
            if examined:
                stop_reason = 'agent_finished'
                break
            if len(seen) >= len(commit_by_sha):
                # 모든 커밋을 이미 시도했지만 diff를 하나도 담지 못했다면
                # 모델에게 같은 선택을 반복해서 요구해도 새로 확인할 대상이 없다.
                stop_reason = 'all_commits_unavailable'
                break
            observations.append(_agent_observation(
                '', 'error', '아직 확인한 diff가 없습니다. 커밋 하나 이상을 선택해야 합니다.'
            ))
            continue

        sha = (decision.sha or '').strip()
        if sha not in commit_by_sha:
            observations.append(_agent_observation(
                sha, 'error', 'PR 커밋 목록에 없는 SHA라서 diff를 가져오지 않았습니다.'
            ))
            logger.warning(
                '[PR 정합성 에이전트] run_id=%s 잘못된 SHA 요청: %s', run_id, sha
            )
            continue
        if sha in seen:
            observations.append(_agent_observation(
                sha, 'duplicate', '이미 확인한 커밋입니다. 다른 커밋을 선택하세요.'
            ))
            logger.info('[PR 정합성 에이전트] run_id=%s 중복 SHA 차단: %s', run_id, sha)
            continue

        seen.add(sha)
        attempted.append(sha)
        logger.info('[PR 정합성 에이전트] run_id=%s action=fetch_commit_diff sha=%s', run_id, sha)
        try:
            files = fetch_commit_diff(owner, repo_name, sha)
            if len(files) >= commit_service._MAX_COMPLETE_COMMIT_FILES:
                observations.append(_agent_observation(
                    sha, 'unavailable', '변경 파일이 300개 이상이라 diff가 잘릴 수 있어 확인하지 않았습니다.'
                ))
                continue

            _, source_files = commit_service._split_generated_files(files)
            patch_text, patch_file_count = commit_service._build_patch_text(source_files)
            if not patch_text:
                if not files:
                    unavailable_reason = '변경된 파일이 없는 빈 커밋입니다.'
                elif not source_files:
                    unavailable_reason = '자동 생성 파일을 제외하니 검증할 소스가 없습니다.'
                else:
                    unavailable_reason = '바이너리 파일이라 코드 변경을 확인할 수 없습니다.'
                observations.append(_agent_observation(sha, 'unavailable', unavailable_reason))
                continue

            patch_injection_hits = llm_client.scan_injection(patch_text)
            if patch_injection_hits:
                logger.warning(
                    '[PR 정합성 에이전트] run_id=%s patch 인젝션 패턴 감지 sha=%s: %s',
                    run_id, sha, patch_injection_hits,
                )

            patch_tokens = llm_client.count_text_tokens(
                patch_text, model=llm_client.COMMIT_CONSISTENCY_MODEL
            )
            if cumulative_tokens + patch_tokens > token_limit:
                remaining_tokens = token_limit - cumulative_tokens
                observations.append(_agent_observation(
                    sha, 'token_limit',
                    '코드 변경량이 너무 커서 이 커밋의 diff를 확인하지 못했습니다. '
                    '더 작은 커밋을 선택하세요.'
                ))
                logger.info(
                    '[PR 정합성 에이전트] run_id=%s 커밋 토큰 예산 초과로 스킵 '
                    '| sha=%s current=%d requested=%d remaining=%d limit=%d',
                    run_id, sha, cumulative_tokens, patch_tokens,
                    remaining_tokens, token_limit,
                )
                continue

            observations.append(_agent_observation(
                sha, 'success', f'{patch_file_count}개 소스 파일의 원본 patch를 확인했습니다.', patch_text
            ))
            examined.append(sha)
            cumulative_tokens += patch_tokens
            logger.info(
                '[PR 정합성 에이전트] run_id=%s observation=success sha=%s files=%d tokens=%d cumulative=%d',
                run_id, sha, patch_file_count, patch_tokens, cumulative_tokens,
            )
            if len(examined) == len(commit_by_sha):
                stop_reason = 'all_commits_examined'
                logger.info(
                    '[PR 정합성 에이전트] run_id=%s 모든 커밋 확인 완료 — 추가 판단 없이 최종 판정',
                    run_id,
                )
                break
        except Exception as error:
            observations.append(_agent_observation(
                sha, 'error', f'diff를 가져오지 못했습니다: {type(error).__name__}'
            ))
            logger.warning(
                '[PR 정합성 에이전트] run_id=%s fetch_commit_diff 실패 sha=%s: %s',
                run_id, sha, error,
            )

    if not examined:
        if any(item.get('status') == 'token_limit' for item in observations):
            reason = (
                'PR의 커밋들이 모두 정합성을 평가하기에 너무 커서 실제 코드 변경을 '
                '확인하지 못했습니다. 평가 불가로 0점이 '
                '반영되었습니다. 커밋을 더 작은 단위로 나누면 평가받을 수 있습니다.'
            )
        else:
            reason = '확인 가능한 커밋 코드 변경을 가져오지 못해 변경 정합성을 평가하지 않았습니다.'
        return {
            'score': 0, 'status': 'N/A', 'reason': reason, 'run_id': run_id,
            'examined_commits': examined, 'attempted_commits': attempted,
            'patch_tokens': cumulative_tokens, 'stop_reason': stop_reason,
            'actual_models': list(dict.fromkeys(actual_models)),
            'commits': _build_commit_trace(commits, observations),
            'llm_cost': llm_cost,
        }

    final = llm_client.score_pr_consistency(
        repo_name, pr_number, pr_title, pr_body, observations
    )
    llm_cost += final.actual_cost
    if final.actual_model:
        actual_models.append(final.actual_model)
    score_by_status = {'matched': 2, 'partially_matched': 1, 'mismatched': 0}
    llm_client.log_judgment(
        f'{owner}/{repo_name}#{pr_number} | PR', 'consistency', final.result,
        f"{final.summary} | 확인 근거: {'; '.join(final.evidence)}",
        final.actual_model,
    )
    logger.info(
        '[PR 정합성 에이전트] run_id=%s 완료 | path=%s | result=%s | stop=%s',
        run_id, ' -> '.join(examined), final.result, stop_reason,
    )
    return {
        'score': score_by_status[final.result], 'status': final.result,
        'reason': final.summary, 'evidence': final.evidence, 'run_id': run_id,
        'examined_commits': examined, 'attempted_commits': attempted,
        'patch_tokens': cumulative_tokens, 'stop_reason': stop_reason,
        'actual_models': list(dict.fromkeys(actual_models)),
        'commits': _build_commit_trace(
            commits, observations, final.commit_summaries
        ),
        'llm_cost': llm_cost,
    }


# ── PR 응집성 ReAct 에이전트 ─────────────────────────────────────

def _run_pr_cohesion_agent(
    owner: str,
    repo_name: str,
    pr_number: int,
    pr_title: str,
    pr_body: str,
    commits: Optional[list[dict]] = None,
) -> dict:
    """제목이 애매한 커밋만 골라 확인하고 PR의 주제 응집성을 판정한다."""
    run_id = uuid.uuid4().hex
    max_iterations = max(1, settings.PR_COHESION_MAX_ITERATIONS)
    token_limit = max(1, settings.PR_COHESION_MAX_TOKENS)
    logger.info(
        '[PR 응집성 에이전트] run_id=%s 시작 | %s/%s#%d | max_iterations=%d | token_limit=%d',
        run_id, owner, repo_name, pr_number, max_iterations, token_limit,
    )

    if commits is None:
        try:
            commits = list_pr_commits(owner, repo_name, pr_number)
        except Exception as error:
            reason = 'PR에 포함된 커밋 목록을 가져오지 못해 응집성을 평가하지 않았습니다.'
            logger.warning(
                '[PR 응집성 에이전트] run_id=%s list_pr_commits 실패: %s', run_id, error
            )
            return {
                'score': None, 'status': 'N/A', 'reason': reason, 'evidence': [],
                'run_id': run_id, 'examined_commits': [], 'attempted_commits': [],
                'patch_tokens': 0, 'stop_reason': 'list_pr_commits_failed',
                'actual_models': [], 'commits': [],
                'llm_cost': 0.0,
            }

    if not commits:
        return {
            'score': None, 'status': 'N/A',
            'reason': 'PR에 포함된 커밋이 없어 응집성을 평가하지 않았습니다.',
            'evidence': [], 'run_id': run_id, 'examined_commits': [],
            'attempted_commits': [], 'patch_tokens': 0,
            'stop_reason': 'empty_commit_list', 'actual_models': [], 'commits': [],
            'llm_cost': 0.0,
        }

    commit_by_sha = {commit['sha']: commit for commit in commits}
    observations: list[dict] = []
    seen: set[str] = set()
    attempted: list[str] = []
    examined: list[str] = []
    actual_models: list[str] = []
    llm_cost = 0.0
    cumulative_tokens = 0
    stop_reason = 'max_iterations'

    logger.info(
        '[PR 응집성 에이전트] run_id=%s list_pr_commits 관찰 | commits=%d',
        run_id, len(commits),
    )
    commit_injection_hits = llm_client.scan_injection(
        '\n'.join(commit['message_headline'] for commit in commits)
    )
    if commit_injection_hits:
        logger.warning(
            '[PR 응집성 에이전트] run_id=%s 커밋 목록 인젝션 패턴 감지: %s',
            run_id, commit_injection_hits,
        )

    for iteration in range(1, max_iterations + 1):
        remaining_tokens = token_limit - cumulative_tokens
        if remaining_tokens < _PR_COHESION_MIN_REMAINING_TOKENS:
            stop_reason = 'budget_exhausted'
            logger.info(
                '[PR 응집성 에이전트] run_id=%s 남은 토큰 예산 부족 | remaining=%d',
                run_id, remaining_tokens,
            )
            break

        decision = llm_client.choose_pr_cohesion_action(
            repo_name, pr_number, pr_title, pr_body, commits, observations,
            remaining_iterations=max_iterations - iteration + 1,
            remaining_tokens=max(0, remaining_tokens),
        )
        llm_cost += decision.actual_cost
        if decision.actual_model:
            actual_models.append(decision.actual_model)
        logger.info(
            '[PR 응집성 에이전트] run_id=%s iteration=%d 판단 | action=%s | sha=%s | reason=%s | model=%s',
            run_id, iteration, decision.action, decision.sha or '-',
            re.sub(r'\s+', ' ', decision.reason), decision.actual_model or 'unknown',
        )

        # 응집성은 제목만으로 충분하면 diff 조회 0회 finish가 정상이다.
        if decision.action == 'finish':
            if (
                not examined
                and len(seen) >= len(commit_by_sha)
                and any(item.get('status') == 'token_limit' for item in observations)
            ):
                stop_reason = 'all_commits_unavailable'
            else:
                stop_reason = 'agent_finished'
            break

        sha = (decision.sha or '').strip()
        if sha not in commit_by_sha:
            observations.append(_agent_observation(
                sha, 'error', 'PR 커밋 목록에 없는 SHA라서 diff를 가져오지 않았습니다.'
            ))
            logger.warning('[PR 응집성 에이전트] run_id=%s 잘못된 SHA 요청: %s', run_id, sha)
            continue
        if sha in seen:
            observations.append(_agent_observation(
                sha, 'duplicate', '이미 확인한 커밋입니다. 다른 커밋을 선택하세요.'
            ))
            logger.info('[PR 응집성 에이전트] run_id=%s 중복 SHA 차단: %s', run_id, sha)
            continue

        seen.add(sha)
        attempted.append(sha)
        logger.info('[PR 응집성 에이전트] run_id=%s action=fetch_commit_diff sha=%s', run_id, sha)
        try:
            files = fetch_commit_diff(owner, repo_name, sha)
            if len(files) >= commit_service._MAX_COMPLETE_COMMIT_FILES:
                observations.append(_agent_observation(
                    sha, 'unavailable', '변경 파일이 300개 이상이라 diff가 잘릴 수 있어 확인하지 않았습니다.'
                ))
                continue

            _, source_files = commit_service._split_generated_files(files)
            patch_text, patch_file_count = commit_service._build_patch_text(source_files)
            if not patch_text:
                if not files:
                    unavailable_reason = '변경된 파일이 없는 빈 커밋입니다.'
                elif not source_files:
                    unavailable_reason = '자동 생성 파일을 제외하니 검증할 소스가 없습니다.'
                else:
                    unavailable_reason = '바이너리 파일이라 코드 변경을 확인할 수 없습니다.'
                observations.append(_agent_observation(sha, 'unavailable', unavailable_reason))
                continue

            patch_injection_hits = llm_client.scan_injection(patch_text)
            if patch_injection_hits:
                logger.warning(
                    '[PR 응집성 에이전트] run_id=%s patch 인젝션 패턴 감지 sha=%s: %s',
                    run_id, sha, patch_injection_hits,
                )

            patch_tokens = llm_client.count_text_tokens(
                patch_text, model=llm_client.PR_COHESION_MODEL
            )
            if cumulative_tokens + patch_tokens > token_limit:
                remaining_tokens = token_limit - cumulative_tokens
                observations.append(_agent_observation(
                    sha, 'token_limit',
                    '코드 변경량이 너무 커서 이 커밋의 diff를 확인하지 못했습니다. '
                    '더 작은 커밋을 선택하세요.'
                ))
                logger.info(
                    '[PR 응집성 에이전트] run_id=%s 커밋 토큰 예산 초과로 스킵 '
                    '| sha=%s current=%d requested=%d remaining=%d limit=%d',
                    run_id, sha, cumulative_tokens, patch_tokens,
                    remaining_tokens, token_limit,
                )
                continue

            observations.append(_agent_observation(
                sha, 'success',
                f'{patch_file_count}개 소스 파일의 원본 patch를 확인했습니다.', patch_text
            ))
            examined.append(sha)
            cumulative_tokens += patch_tokens
            logger.info(
                '[PR 응집성 에이전트] run_id=%s observation=success sha=%s files=%d tokens=%d cumulative=%d',
                run_id, sha, patch_file_count, patch_tokens, cumulative_tokens,
            )
        except Exception as error:
            observations.append(_agent_observation(
                sha, 'error', f'diff를 가져오지 못했습니다: {type(error).__name__}'
            ))
            logger.warning(
                '[PR 응집성 에이전트] run_id=%s fetch_commit_diff 실패 sha=%s: %s',
                run_id, sha, error,
            )

    if (
        not examined
        and any(item.get('status') == 'token_limit' for item in observations)
    ):
        reason = (
            '응집성 판정에 필요해 선택한 커밋들의 변경량이 모두 너무 커서 실제 '
            '변경을 확인하지 못했습니다. '
            '평가 불가로 0점이 반영되었습니다. 커밋을 더 작은 단위로 나누면 '
            '평가받을 수 있습니다.'
        )
        return {
            'score': 0, 'status': 'N/A', 'reason': reason, 'evidence': [],
            'run_id': run_id, 'examined_commits': examined,
            'attempted_commits': attempted, 'patch_tokens': cumulative_tokens,
            'stop_reason': stop_reason,
            'actual_models': list(dict.fromkeys(actual_models)),
            'commits': _build_commit_trace(commits, observations),
            'llm_cost': llm_cost,
        }

    final = llm_client.score_pr_cohesion(
        repo_name, pr_number, pr_title, pr_body, commits, observations
    )
    llm_cost += final.actual_cost
    if final.actual_model:
        actual_models.append(final.actual_model)
    score_by_status = {'cohesive': 1, 'scattered': 0}
    llm_client.log_judgment(
        f'{owner}/{repo_name}#{pr_number} | PR', 'cohesion', final.result,
        f"{final.summary} | 근거: {'; '.join(final.evidence)}",
        final.actual_model,
    )
    logger.info(
        '[PR 응집성 에이전트] run_id=%s 완료 | path=%s | result=%s | stop=%s',
        run_id, ' -> '.join(examined) or '(제목만으로 판정)',
        final.result, stop_reason,
    )
    return {
        'score': score_by_status[final.result], 'status': final.result,
        'reason': final.summary, 'evidence': final.evidence, 'run_id': run_id,
        'examined_commits': examined, 'attempted_commits': attempted,
        'patch_tokens': cumulative_tokens, 'stop_reason': stop_reason,
        'actual_models': list(dict.fromkeys(actual_models)),
        'commits': _build_commit_trace(commits, observations, final.commit_summaries),
        'llm_cost': llm_cost,
    }


# ── 문장화 입력 구성 ──────────────────────────────────────────────

_FULFILMENT_LABELS = {
    'what': '변경 내용(What)',
    'why': '변경 이유(Why)',
    'verification': '테스트·확인 방법',
}

_CLARITY_SCORE_LABELS = {
    'title_specificity': 'PR 제목 구체성',
    'title_body_match': '제목-본문 일치성',
}
_SINGLE_FOCUS_ADVICE = '단일 목적 집중(PR을 나누면 리뷰가 쉬워집니다)'

_BONUS_REASONS = {
    '이슈 연결': {
        True: 'PR 제목이나 본문에 이슈를 닫는 키워드 또는 GitHub 이슈 URL이 있습니다.',
        False: 'PR 제목과 본문에서 연결된 GitHub 이슈를 확인하지 못했습니다.',
    },
    '커밋 컨벤션': {
        True: 'PR 제목이 feat:, fix: 등 인정된 컨벤션 접두사를 사용합니다.',
        False: 'PR 제목에서 feat:, fix: 등 인정된 컨벤션 접두사를 확인하지 못했습니다.',
    },
    '리뷰 보조자료': {
        True: 'PR 본문에 스크린샷, 실질적인 코드 블록 또는 체크리스트가 있습니다.',
        False: 'PR 본문에서 스크린샷, 실질적인 코드 블록, 체크리스트를 확인하지 못했습니다.',
    },
}


def _build_sentence_inputs(
    f: llm_client.PrFulfilmentResult,
    c: llm_client.PrClarityResult,
    bonus_earned: list,
    bonus_missing: list,
    consistency_status: Optional[str] = None,
    consistency_score: Optional[int] = None,
    consistency_reason: str = '',
    cohesion_status: Optional[str] = None,
    cohesion_reason: str = '',
) -> tuple:
    """(good_items, bad_items) 반환."""
    good, bad = [], []

    for key, label in _FULFILMENT_LABELS.items():
        item = {'label': label, 'reason': getattr(f, f'{key}_reason')}
        (good if getattr(f, key) == 'satisfied' else bad).append(item)

    # 칭찬: 점수용 신호(제목 구체성/일치)가 하나라도 satisfied면 통합 1개
    satisfied_clarity_reasons = [
        getattr(c, f'{key}_reason')
        for key in _CLARITY_SCORE_LABELS
        if getattr(c, key) == 'satisfied'
    ]
    if satisfied_clarity_reasons:
        good.append({
            'label': '목적 명료성',
            'reason': ' / '.join(satisfied_clarity_reasons),
        })
    # 개선점: 점수용 신호 unsatisfied는 개별
    for key, label in _CLARITY_SCORE_LABELS.items():
        if getattr(c, key) == 'unsatisfied':
            bad.append({'label': label, 'reason': getattr(c, f'{key}_reason')})
    # single_focus는 점수와 무관 — unsatisfied일 때만 조언으로
    if c.single_focus == 'unsatisfied':
        bad.append({
            'label': _SINGLE_FOCUS_ADVICE,
            'reason': c.single_focus_reason,
        })
    # N/A는 언급 안 함

    good.extend({
        'label': label,
        'reason': _BONUS_REASONS[label][True],
    } for label in bonus_earned)
    bad.extend({
        'label': label,
        'reason': _BONUS_REASONS[label][False],
    } for label in bonus_missing)

    # 정합성 N/A가 감점되지 않는 경우에는 문장화에서 제외한다. 다만 변경량
    # 초과 등으로 평가 불가 0점이 반영된 경우에는 그 사유와 개선 방법을
    # 사용자에게 안내할 수 있도록 보완 항목으로 전달한다.
    if consistency_status == 'matched':
        good.append({'label': '변경 정합성', 'reason': consistency_reason})
    elif consistency_status == 'partially_matched':
        bad.append({
            'label': '변경 정합성(설명과 실제 변경이 일부만 일치)',
            'reason': consistency_reason,
        })
    elif consistency_status == 'mismatched':
        bad.append({
            'label': '변경 정합성(설명과 실제 변경이 일치하지 않음)',
            'reason': consistency_reason,
        })
    elif consistency_status == 'N/A' and consistency_score == 0:
        bad.append({
            'label': '변경 정합성(변경량 초과로 평가하지 못함)',
            'reason': consistency_reason,
        })

    if cohesion_status == 'cohesive':
        good.append({'label': 'PR 응집성', 'reason': cohesion_reason})
    elif cohesion_status == 'scattered':
        bad.append({
            'label': 'PR 응집성(서로 무관한 여러 작업이 섞임)',
            'reason': cohesion_reason,
        })

    return good, bad


# ── 평가 실행 ─────────────────────────────────────────────────────

def _run_pr_agents_parallel(
    owner: str,
    repo_name: str,
    pr_number: int,
    pr_title: str,
    pr_body: str,
) -> tuple[dict, dict]:
    """독립적인 정합성·응집성 에이전트를 동시에 실행한다."""
    shared_commits = None
    try:
        shared_commits = list_pr_commits(owner, repo_name, pr_number)
    except Exception as error:
        # 일시적인 목록 조회 실패라면 각 에이전트가 자체 조회를 한 번 더
        # 시도하도록 한다. 기존의 독립적인 실패 처리도 그대로 유지된다.
        logger.warning(
            '[PR 평가] 공유 커밋 목록 조회 실패 — 에이전트별 재시도: %s',
            error,
        )

    agent_args = (owner, repo_name, pr_number, pr_title, pr_body)
    with ThreadPoolExecutor(
        max_workers=2,
        thread_name_prefix='pr-evaluation-agent',
    ) as executor:
        consistency_future = executor.submit(
            copy_context().run,
            _run_pr_consistency_agent,
            *agent_args,
            commits=shared_commits,
        )
        cohesion_future = executor.submit(
            copy_context().run,
            _run_pr_cohesion_agent,
            *agent_args,
            commits=shared_commits,
        )
        consistency = consistency_future.result()
        cohesion = cohesion_future.result()

    return consistency, cohesion


def evaluate(
    github_username: str,
    repo_name: str,
    pr_number: int,
    progress_callback: Optional[Callable[[str], None]] = None,
) -> dict:
    # 1. PR 기본 정보 조회
    pull = GithubPulls.objects.filter(
        owner_id=github_username, repo_name=repo_name, number=pr_number
    ).first()
    if not pull:
        raise ValueError(f"PR을 찾을 수 없습니다: {github_username}/{repo_name}#{pr_number}")

    raw_title = pull.title or ''
    raw_body = _get_pr_body(github_username, repo_name, pr_number) or ''
    injection_hits = llm_client.scan_injection(raw_title + '\n' + raw_body)
    if injection_hits:
        logger.warning("PR 인젝션 패턴 감지 (원문): %s/%s#%d → %s", github_username, repo_name, pr_number, injection_hits)
    pr_title = sanitize_text(raw_title, 'PR 제목')
    pr_body = sanitize_text(raw_body, 'PR 본문')
    body_present = bool(pr_body.strip())

    # 2. 보너스 판정 (코드)
    bonus_score, bonus_earned = _compute_bonus(pr_title, pr_body)
    all_bonus_labels = ['이슈 연결', '커밋 컨벤션', '리뷰 보조자료']
    bonus_missing = [b for b in all_bonus_labels if b not in bonus_earned]

    # 3. LLM 채점 (temperature 0.0)
    logger.info("LLM PR 채점 시작: %s/%s#%d (body_present=%s)", github_username, repo_name, pr_number, body_present)
    score = llm_client.score_pr(repo_name, pr_number, pr_title, pr_body, body_present)

    f = score.fulfilment
    c = score.clarity
    judgment_label = f'{github_username}/{repo_name}#{pr_number} | PR'
    for criterion, result, reason in (
        ('what', f.what, f.what_reason),
        ('why', f.why, f.why_reason),
        ('verification', f.verification, f.verification_reason),
        ('title_specificity', c.title_specificity, c.title_specificity_reason),
        ('title_body_match', c.title_body_match, c.title_body_match_reason),
        ('single_focus', c.single_focus, c.single_focus_reason),
    ):
        llm_client.log_judgment(
            judgment_label, criterion, result, reason, score.actual_model
        )
    logger.info(
        "[LLM 판정 근거] %s | criterion=why | evidence_quote=%s",
        judgment_label,
        f.why_evidence_quote or '(없음)',
    )

    fulfilment_score = _compute_fulfilment_score(score.fulfilment)
    clarity_score = _compute_clarity_score(score.clarity)

    # What이 없으면 대조 기준 자체가 없으므로 이중 감점하지 않는다.
    if score.fulfilment.what != 'satisfied':
        consistency = {
            'score': None,
            'status': 'N/A',
            'reason': 'PR 설명만으로는 무엇을 변경했는지 알기 어려워 실제 코드와의 일치 여부를 평가하지 않았습니다.',
            'run_id': uuid.uuid4().hex,
            'examined_commits': [],
            'attempted_commits': [],
            'patch_tokens': 0,
            'stop_reason': 'insufficient_description',
            'actual_models': [],
            'commits': [],
            'llm_cost': 0.0,
        }
        if progress_callback:
            progress_callback('cohesion_agent')
        cohesion = _run_pr_cohesion_agent(
            github_username, repo_name, pr_number, pr_title, pr_body
        )
    else:
        if progress_callback:
            progress_callback('evaluation_agents')
        consistency, cohesion = _run_pr_agents_parallel(
            github_username, repo_name, pr_number, pr_title, pr_body
        )

    if progress_callback:
        progress_callback('finalizing')

    # 보너스 게이팅: 충실도 0점(What도 미충족)이면 보너스 무효화
    if fulfilment_score == 0 and bonus_score > 0:
        logger.info(
            "보너스 게이팅 발동: %s/%s#%d — 충실도 0점으로 보너스 %.1f점 무효화",
            github_username, repo_name, pr_number, bonus_score,
        )
        bonus_score = 0.0
        bonus_missing = all_bonus_labels
        bonus_earned = []

    consistency_score = consistency['score']
    cohesion_score = cohesion['score']
    # 평가 불가 축도 0점으로 반영하고 PR은 항상 동일한 9점 척도를 사용한다.
    max_score = 9
    total = round(
        fulfilment_score + clarity_score + bonus_score
        + (consistency_score or 0) + (cohesion_score or 0), 1
    )
    grade = _to_grade(total, max_score)

    # 4. 문장화 입력 구성
    good_items, bad_items = _build_sentence_inputs(
        score.fulfilment, score.clarity, bonus_earned, bonus_missing,
        consistency_status=consistency['status'],
        consistency_score=consistency['score'],
        consistency_reason=consistency['reason'],
        cohesion_status=cohesion['status'],
        cohesion_reason=cohesion['reason'],
    )

    # 5. LLM 문장화 (temperature 0.7)
    logger.info("LLM PR 문장화 시작: %s/%s#%d", github_username, repo_name, pr_number)
    sentences = llm_client.write_pr_sentences(
        repo_name, pr_number, pr_title, pr_body, good_items, bad_items,
    )
    total_llm_cost = sum((
        score.actual_cost,
        consistency.get('llm_cost', 0.0),
        cohesion.get('llm_cost', 0.0),
        sentences.actual_cost,
    ))

    strengths = (sentences.strengths or []) or [
        "아직 강조할 만한 항목을 찾지 못했어요. 아래 보완할 점을 참고해 주세요."
    ]
    improvements = (sentences.improvements or []) or [
        "모든 항목이 충실히 작성되어 현재 보완할 점은 없습니다. 훌륭합니다!"
    ]

    # 6. DB 저장
    entity, _ = GithubPrAiEvaluation.objects.get_or_create(
        github_id=github_username,
        repo_name=repo_name,
        pr_number=pr_number,
    )
    entity.pr_score = grade
    entity.pr_total_score = total
    # 단일 VARCHAR 컬럼에는 최종 정합성 판정 모델을 우선 기록하고, 전체 호출 모델은
    # breakdown JSON에 보존한다.
    entity.model_name = (
        cohesion['actual_models'][-1]
        if cohesion['actual_models']
        else consistency['actual_models'][-1]
        if consistency['actual_models']
        else score.actual_model
    )
    entity.pr_breakdown = {
        'fulfilment': fulfilment_score,
        'why_evidence_quote': score.fulfilment.why_evidence_quote,
        'clarity': clarity_score,
        'bonus': bonus_score,
        'bonus_earned': bonus_earned,
        'consistency': consistency_score,
        'consistency_status': consistency['status'],
        'consistency_reason': consistency['reason'],
        'consistency_evidence': consistency.get('evidence', []),
        'consistency_run_id': consistency['run_id'],
        'consistency_examined_commits': consistency['examined_commits'],
        'consistency_attempted_commits': consistency['attempted_commits'],
        'consistency_patch_tokens': consistency['patch_tokens'],
        'consistency_stop_reason': consistency['stop_reason'],
        'consistency_commits': consistency['commits'],
        'cohesion': cohesion_score,
        'cohesion_status': cohesion['status'],
        'cohesion_reason': cohesion['reason'],
        'cohesion_evidence': cohesion.get('evidence', []),
        'cohesion_run_id': cohesion['run_id'],
        'cohesion_examined_commits': cohesion['examined_commits'],
        'cohesion_attempted_commits': cohesion['attempted_commits'],
        'cohesion_patch_tokens': cohesion['patch_tokens'],
        'cohesion_stop_reason': cohesion['stop_reason'],
        'cohesion_commits': cohesion['commits'],
        'models': {
            'text_evaluation': score.actual_model,
            'consistency_agent': consistency['actual_models'],
            'cohesion_agent': cohesion['actual_models'],
        },
        'max_score': max_score,
    }
    entity.pr_strengths = strengths
    entity.pr_improvements = improvements
    entity.pr_advice = sentences.advice or []
    entity.pr_missing = [item['label'] for item in bad_items]
    entity.save()

    logger.info(
        "PR 평가 완료: %s/%s#%d → %s (%.1f/%d점 = 충실도%d + 명료성%d + 보너스%.1f + 정합성%s + 응집성%s) | consistency_run_id=%s | cohesion_run_id=%s",
        github_username, repo_name, pr_number, grade, total,
        max_score, fulfilment_score, clarity_score, bonus_score,
        'N/A' if consistency_score is None else consistency_score,
        'N/A' if cohesion_score is None else cohesion_score,
        consistency['run_id'],
        cohesion['run_id'],
    )
    logger.info(
        '[LLM 총 비용] %s/%s#%d | PR 평가 | total=$%.6f '
        '| 텍스트 채점=$%.6f | 정합성 에이전트=$%.6f '
        '| 응집성 에이전트=$%.6f | 문장화=$%.6f',
        github_username,
        repo_name,
        pr_number,
        total_llm_cost,
        score.actual_cost,
        consistency.get('llm_cost', 0.0),
        cohesion.get('llm_cost', 0.0),
        sentences.actual_cost,
    )
    return _entity_to_dict(entity, pr_body)


# ── dict 변환 ─────────────────────────────────────────────────────

def _entity_to_dict(entity: GithubPrAiEvaluation, pr_body: Optional[str] = None) -> dict:
    return {
        'evaluated': True,
        'pr_number': entity.pr_number,
        'model_name': entity.model_name,
        'pr_score': entity.pr_score,
        'pr_total_score': entity.pr_total_score,
        'pr_breakdown': entity.pr_breakdown,
        'pr_strengths': entity.pr_strengths,
        'pr_improvements': entity.pr_improvements,
        'pr_advice': entity.pr_advice,
        'updated_at': entity.updated_at.isoformat() if entity.updated_at else None,
        'pr_body': pr_body,
    }
