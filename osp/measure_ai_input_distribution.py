"""DB에 저장된 GitHub 활동의 AI 평가 입력 크기 분포를 측정한다.

DB는 읽기만 하며 README/PR/Issue/Commit을 각각 고정 시드로 표본 추출한다.
PR 커밋 목록과 commit patch는 DB에 없으므로 기존 Spring API를 사용한다.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import random
import statistics
import sys
import time
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import quote

import django
import requests


BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'osp.settings')
os.environ.setdefault('RUN_MAIN', 'true')
sys.path.insert(0, str(BASE_DIR))
django.setup()

from django.conf import settings  # noqa: E402
from django.db import connection  # noqa: E402

from osp import commit_evaluation_service as commit_service  # noqa: E402
from osp import llm_client  # noqa: E402


TARGET_SEED_OFFSETS = {
    'README': 0,
    'PR': 1,
    'ISSUE': 2,
    'COMMIT': 3,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            'SOSD DB의 README/PR/Issue/Commit AI 평가 입력 문자·토큰 분포를 '
            '측정하고 원자료 CSV와 JSON을 저장합니다.'
        )
    )
    parser.add_argument(
        '--sample-size', type=int, default=500,
        help='대상별 최대 무작위 표본 수(기본 500)',
    )
    parser.add_argument(
        '--full-scan', action='store_true',
        help='표본을 뽑지 않고 대상별 전수를 측정합니다.',
    )
    parser.add_argument(
        '--seed', type=int, default=20260831,
        help='재현 가능한 무작위 표본 시드',
    )
    parser.add_argument(
        '--spring-url', default=settings.SPRING_BACKEND_URL,
        help='PR 커밋 목록과 diff를 조회할 Spring API 주소',
    )
    parser.add_argument(
        '--timeout', type=float, default=30.0,
        help='Spring API 요청별 제한 시간(초)',
    )
    parser.add_argument(
        '--request-delay', type=float, default=0.0,
        help='GitHub rate limit 완화를 위한 Spring API 요청 간 대기 시간(초)',
    )
    parser.add_argument(
        '--progress-every', type=int, default=100,
        help='진행 상황 출력 간격',
    )
    parser.add_argument(
        '--output-dir', type=Path, default=Path('ai_input_distribution'),
        help='raw.csv, raw.json, summary.json 저장 디렉터리',
    )
    parser.add_argument(
        '--cache-dir', type=Path,
        default=Path('ai_input_distribution/api_cache'),
        help='Spring API GET 응답 캐시 디렉터리',
    )
    parser.add_argument(
        '--no-api-cache', action='store_true',
        help='저장된 Spring API 응답 캐시를 사용하지 않습니다.',
    )
    parser.add_argument(
        '--skip-pr-patches', action='store_true',
        help='PR 텍스트·커밋 수만 측정하고 PR별 patch 합계는 생략합니다.',
    )
    args = parser.parse_args()
    if args.sample_size <= 0:
        parser.error('--sample-size는 1 이상이어야 합니다.')
    if args.timeout <= 0:
        parser.error('--timeout은 0보다 커야 합니다.')
    if args.request_delay < 0:
        parser.error('--request-delay는 0 이상이어야 합니다.')
    if args.progress_every <= 0:
        parser.error('--progress-every는 1 이상이어야 합니다.')
    return args


def _query(sql: str) -> list[tuple]:
    with connection.cursor() as cursor:
        cursor.execute(sql)
        return cursor.fetchall()


def load_readmes() -> list[dict]:
    rows = _query("""
        SELECT id, owner_name, repo_name, readme
        FROM github_repository
        WHERE readme IS NOT NULL AND TRIM(readme) <> ''
    """)
    return [
        {'db_id': row[0], 'owner': row[1], 'repo': row[2], 'text': row[3] or ''}
        for row in rows
    ]


def load_prs() -> list[dict]:
    rows = _query("""
        SELECT gpr.id, gr.owner_name, gr.repo_name, gpr.pr_number,
               gpr.pr_title, gpr.pr_body
        FROM github_pull_request gpr
        JOIN github_repository gr ON gr.id = gpr.repo_id
        WHERE gr.owner_name IS NOT NULL AND gr.owner_name <> ''
          AND gr.repo_name IS NOT NULL AND gr.repo_name <> ''
    """)
    return [
        {
            'db_id': row[0], 'owner': row[1], 'repo': row[2],
            'number': row[3], 'title': row[4] or '', 'body': row[5] or '',
        }
        for row in rows
    ]


def load_issues() -> list[dict]:
    rows = _query("""
        SELECT gi.id, gr.owner_name, gr.repo_name, gi.issue_number,
               gi.issue_title, gi.issue_body
        FROM github_issue gi
        JOIN github_repository gr ON gr.id = gi.repo_id
        WHERE gr.owner_name IS NOT NULL AND gr.owner_name <> ''
          AND gr.repo_name IS NOT NULL AND gr.repo_name <> ''
    """)
    return [
        {
            'db_id': row[0], 'owner': row[1], 'repo': row[2],
            'number': row[3], 'title': row[4] or '', 'body': row[5] or '',
        }
        for row in rows
    ]


def load_commits() -> list[dict]:
    rows = _query("""
        SELECT gc.id, gr.owner_name, gr.repo_name, gc.sha,
               gc.message, gc.message_body,
               COALESCE(gc.addition, 0), COALESCE(gc.deletion, 0)
        FROM github_commit gc
        JOIN github_repository gr ON gr.id = gc.repo_id
        WHERE gc.sha IS NOT NULL AND gc.sha <> ''
          AND gr.owner_name IS NOT NULL AND gr.owner_name <> ''
          AND gr.repo_name IS NOT NULL AND gr.repo_name <> ''
    """)
    return [
        {
            'db_id': row[0], 'owner': row[1], 'repo': row[2],
            'sha': row[3], 'message': row[4] or '', 'message_body': row[5] or '',
            'additions': row[6], 'deletions': row[7],
        }
        for row in rows
    ]


def sample_rows(
    rows: list[dict], target: str, sample_size: int, seed: int, full_scan: bool
) -> list[dict]:
    if full_scan or len(rows) <= sample_size:
        return list(rows)
    rng = random.Random(seed + TARGET_SEED_OFFSETS[target])
    return rng.sample(rows, sample_size)


def compose_title_body(title: str, body: str) -> str:
    """실제 평가에 전달되는 제목과 본문을 한 텍스트로 계산한다."""
    return f'{title}\n\n{body}'.strip()


def compose_commit_message(headline: str, body: str) -> str:
    return f'{headline}\n\n{body}'.strip()


def count_tokens(text: str, model: str) -> int:
    if not text:
        return 0
    return llm_client.count_text_tokens(text, model=model)


class ApiClient:
    def __init__(
        self, base_url: str, timeout: float, delay: float,
        cache_dir: Path, use_cache: bool,
    ) -> None:
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.delay = delay
        self.cache_dir = cache_dir
        self.use_cache = use_cache
        self.session = requests.Session()
        self.memory_cache: dict[str, dict] = {}
        if use_cache:
            cache_dir.mkdir(parents=True, exist_ok=True)

    def close(self) -> None:
        self.session.close()

    def _cache_path(self, url: str) -> Path:
        digest = hashlib.sha256(url.encode('utf-8')).hexdigest()
        return self.cache_dir / f'{digest}.json'

    def get_json(self, path: str) -> dict:
        url = f'{self.base_url}{path}'
        if url in self.memory_cache:
            return self.memory_cache[url]
        cache_path = self._cache_path(url)
        if self.use_cache and cache_path.exists():
            payload = json.loads(cache_path.read_text(encoding='utf-8'))
            self.memory_cache[url] = payload
            return payload
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise ValueError(f'객체가 아닌 API 응답입니다: {url}')
        self.memory_cache[url] = payload
        if self.use_cache:
            cache_path.write_text(
                json.dumps(payload, ensure_ascii=False), encoding='utf-8'
            )
        if self.delay:
            time.sleep(self.delay)
        return payload

    def pr_commits(self, owner: str, repo: str, number: int) -> list[dict]:
        parts = '/'.join(quote(str(value), safe='') for value in (owner, repo))
        payload = self.get_json(
            f'/api/v1/github/pulls/{parts}/{number}/commits'
        )
        commits = payload.get('commits') or []
        if not isinstance(commits, list):
            raise ValueError('PR 커밋 목록 API의 commits가 배열이 아닙니다.')
        return [item for item in commits if isinstance(item, dict) and item.get('sha')]

    def commit_files(self, owner: str, repo: str, sha: str) -> list[dict]:
        parts = '/'.join(
            quote(str(value), safe='') for value in (owner, repo, sha)
        )
        payload = self.get_json(f'/api/v1/github/commits/{parts}/diff')
        files = payload.get('files') or []
        if not isinstance(files, list):
            raise ValueError('커밋 diff API의 files가 배열이 아닙니다.')
        return [item for item in files if isinstance(item, dict) and item.get('filename')]


def source_patch(files: list[dict]) -> tuple[str, int, int, int]:
    generated, source = commit_service._split_generated_files(files)
    patch, patch_file_count = commit_service._build_patch_text(source)
    unavailable = sum(
        not isinstance(item.get('patch'), str) or not item.get('patch', '').strip()
        for item in source
    )
    return patch, len(generated), patch_file_count, unavailable


def _progress(target: str, index: int, total: int, every: int) -> None:
    if index == 1 or index == total or index % every == 0:
        print(f'[{target}] {index:,}/{total:,} 측정 완료', flush=True)


def measure_readmes(rows: list[dict], progress_every: int) -> list[dict]:
    measured = []
    for index, item in enumerate(rows, 1):
        text = item['text']
        # 요청한 원문 전체 크기와 현재 score_readme가 실제 LLM에 보내는
        # MAX_README_CHARS 적용 크기를 함께 남긴다.
        llm_text = llm_client._truncate(text)
        measured.append({
            'target': 'README', 'status': 'measured',
            'owner': item['owner'], 'repo': item['repo'], 'identifier': item['db_id'],
            'input_chars': len(text),
            'input_tokens': count_tokens(text, llm_client.LLM_MODEL),
            'llm_effective_chars': len(llm_text),
            'llm_effective_tokens': count_tokens(llm_text, llm_client.LLM_MODEL),
        })
        _progress('README', index, len(rows), progress_every)
    return measured


def measure_issues(rows: list[dict], progress_every: int) -> list[dict]:
    measured = []
    for index, item in enumerate(rows, 1):
        text = compose_title_body(item['title'], item['body'])
        measured.append({
            'target': 'ISSUE', 'status': 'measured',
            'owner': item['owner'], 'repo': item['repo'], 'identifier': item['number'],
            'title_chars': len(item['title']), 'body_chars': len(item['body']),
            'input_chars': len(text),
            'input_tokens': count_tokens(text, llm_client.LLM_MODEL),
        })
        _progress('ISSUE', index, len(rows), progress_every)
    return measured


def measure_commit_patch(
    api: ApiClient, owner: str, repo: str, sha: str,
) -> dict:
    files = api.commit_files(owner, repo, sha)
    # GitHub REST commit files는 최대 300개이며 실제 평가도 이 조건에서 제외한다.
    file_limit = len(files) >= commit_service._MAX_COMPLETE_COMMIT_FILES
    if file_limit:
        return {
            'total_files': len(files), 'files_300_plus': True,
            'generated_files': '', 'patch_files': '',
            'patch_unavailable_files': '', 'patch_chars': '', 'patch_tokens': '',
        }
    patch, generated_count, patch_file_count, unavailable = source_patch(files)
    return {
        'total_files': len(files), 'files_300_plus': False,
        'generated_files': generated_count, 'patch_files': patch_file_count,
        'patch_unavailable_files': unavailable, 'patch_chars': len(patch),
        'patch_tokens': count_tokens(patch, llm_client.COMMIT_CONSISTENCY_MODEL),
        '_patch_text': patch,
    }


def measure_commits(
    rows: list[dict], api: ApiClient, progress_every: int,
) -> list[dict]:
    measured = []
    for index, item in enumerate(rows, 1):
        message = compose_commit_message(item['message'], item['message_body'])
        is_merge = commit_service._is_merge_commit(item['message'])
        row: dict[str, Any] = {
            'target': 'COMMIT', 'status': 'merge_skipped' if is_merge else 'pending',
            'owner': item['owner'], 'repo': item['repo'], 'identifier': item['sha'],
            'additions': item['additions'], 'deletions': item['deletions'],
            'is_merge_commit': is_merge,
            'message_chars': len(message),
            'message_tokens': count_tokens(message, llm_client.COMMIT_MESSAGE_MODEL),
            'files_300_plus': False, 'error': '',
        }
        if not is_merge:
            try:
                patch_data = measure_commit_patch(
                    api, item['owner'], item['repo'], item['sha']
                )
                patch_text = patch_data.pop('_patch_text', '')
                row.update(patch_data)
                if row['files_300_plus']:
                    row['status'] = 'file_limit_skipped'
                else:
                    combined = compose_title_body(message, patch_text)
                    row.update({
                        'status': 'measured',
                        'input_chars': len(combined),
                        'input_tokens': count_tokens(
                            combined, llm_client.COMMIT_CONSISTENCY_MODEL
                        ),
                    })
            except Exception as error:
                row['status'] = 'api_error'
                row['error'] = f'{type(error).__name__}: {error}'
        measured.append(row)
        _progress('COMMIT', index, len(rows), progress_every)
    return measured


def measure_prs(
    rows: list[dict], api: ApiClient, progress_every: int,
    skip_patches: bool,
) -> list[dict]:
    measured = []
    for index, item in enumerate(rows, 1):
        text = compose_title_body(item['title'], item['body'])
        row: dict[str, Any] = {
            'target': 'PR', 'status': 'measured',
            'owner': item['owner'], 'repo': item['repo'], 'identifier': item['number'],
            'title_chars': len(item['title']), 'body_chars': len(item['body']),
            'input_chars': len(text),
            'input_tokens': count_tokens(text, llm_client.LLM_MODEL),
            'commit_count': '', 'pr_patch_chars': '', 'pr_patch_tokens': '',
            'patch_measured_commits': '', 'patch_skipped_commits': '',
            'patch_error_commits': '', 'error': '',
        }
        try:
            commits = api.pr_commits(
                item['owner'], item['repo'], item['number']
            )
            row['commit_count'] = len(commits)
            if not skip_patches:
                total_patch = []
                measured_count = skipped_count = error_count = 0
                for commit in commits:
                    file_count = commit.get('fileCount')
                    if (
                        isinstance(file_count, int)
                        and file_count >= commit_service._MAX_COMPLETE_COMMIT_FILES
                    ):
                        skipped_count += 1
                        continue
                    try:
                        patch_data = measure_commit_patch(
                            api, item['owner'], item['repo'], str(commit['sha'])
                        )
                        patch_text = patch_data.get('_patch_text', '')
                        if patch_data['files_300_plus']:
                            skipped_count += 1
                        else:
                            measured_count += 1
                            if patch_text:
                                total_patch.append(patch_text)
                    except Exception:
                        error_count += 1
                patch_text = '\n\n'.join(total_patch)
                row.update({
                    'pr_patch_chars': len(patch_text),
                    'pr_patch_tokens': count_tokens(
                        patch_text, llm_client.COMMIT_CONSISTENCY_MODEL
                    ),
                    'patch_measured_commits': measured_count,
                    'patch_skipped_commits': skipped_count,
                    'patch_error_commits': error_count,
                })
        except Exception as error:
            row['status'] = 'api_error'
            row['error'] = f'{type(error).__name__}: {error}'
        measured.append(row)
        _progress('PR', index, len(rows), progress_every)
    return measured


def nearest_rank(values: list[float], percentile: float) -> float:
    """보간 없이 재현 가능한 nearest-rank 백분위수를 계산한다."""
    if not values:
        raise ValueError('빈 값의 백분위수는 계산할 수 없습니다.')
    ordered = sorted(values)
    rank = max(1, math.ceil(percentile / 100 * len(ordered)))
    return ordered[min(rank - 1, len(ordered) - 1)]


def describe(values: Iterable[int | float]) -> dict[str, int | float]:
    clean = [value for value in values if isinstance(value, (int, float))]
    if not clean:
        return {'N': 0}
    return {
        'N': len(clean),
        'min': min(clean),
        'mean': round(statistics.fmean(clean), 2),
        'median': round(statistics.median(clean), 2),
        'p90': nearest_rank(clean, 90),
        'p95': nearest_rank(clean, 95),
        'p99': nearest_rank(clean, 99),
        'max': max(clean),
    }


def build_summary(rows: list[dict]) -> dict:
    metrics = {
        'README': (
            'input_chars', 'input_tokens',
            'llm_effective_chars', 'llm_effective_tokens',
        ),
        'PR': (
            'input_chars', 'input_tokens', 'commit_count',
            'pr_patch_chars', 'pr_patch_tokens',
        ),
        'ISSUE': ('input_chars', 'input_tokens'),
        'COMMIT': (
            'message_chars', 'message_tokens', 'patch_chars', 'patch_tokens',
            'input_chars', 'input_tokens',
        ),
    }
    summary: dict[str, Any] = {}
    for target, target_metrics in metrics.items():
        target_rows = [row for row in rows if row['target'] == target]
        summary[target] = {
            'sampled_N': len(target_rows),
            'status_counts': {
                status: sum(row.get('status') == status for row in target_rows)
                for status in sorted({str(row.get('status')) for row in target_rows})
            },
            'metrics': {
                metric: describe(row.get(metric) for row in target_rows)
                for metric in target_metrics
            },
        }

    commits = [row for row in rows if row['target'] == 'COMMIT']
    measured_commits = [
        row for row in commits if isinstance(row.get('patch_tokens'), (int, float))
    ]
    denominator = len(commits)
    summary['COMMIT']['ratios'] = {
        'patch_over_30000': _ratio(
            sum(row['patch_tokens'] > 30000 for row in measured_commits),
            len(measured_commits),
        ),
        'patch_over_60000': _ratio(
            sum(row['patch_tokens'] > 60000 for row in measured_commits),
            len(measured_commits),
        ),
        'files_300_plus': _ratio(
            sum(bool(row.get('files_300_plus')) for row in commits), denominator,
        ),
        'merge_commit': _ratio(
            sum(bool(row.get('is_merge_commit')) for row in commits), denominator,
        ),
    }
    summary['COMMIT']['threshold_denominator'] = len(measured_commits)
    return summary


def _ratio(count: int, total: int) -> dict[str, int | float]:
    return {
        'count': count,
        'total': total,
        'percent': round(count / total * 100, 2) if total else 0.0,
    }


def print_summary(summary: dict) -> None:
    print('\n=== AI 평가 입력 크기 분포 ===')
    header = (
        f"{'대상':<8} {'지표':<22} {'N':>7} {'min':>12} {'mean':>12} "
        f"{'median':>12} {'p90':>12} {'p95':>12} {'p99':>12} {'max':>12}"
    )
    print(header)
    print('-' * len(header))
    for target in ('README', 'PR', 'ISSUE', 'COMMIT'):
        for metric, stats in summary[target]['metrics'].items():
            if not stats.get('N'):
                continue
            print(
                f"{target:<8} {metric:<22} {stats['N']:>7,} "
                f"{_fmt(stats['min']):>12} {_fmt(stats['mean']):>12} "
                f"{_fmt(stats['median']):>12} {_fmt(stats['p90']):>12} "
                f"{_fmt(stats['p95']):>12} {_fmt(stats['p99']):>12} "
                f"{_fmt(stats['max']):>12}"
            )
    print('\n=== Commit 제외·예산 위험 비율 ===')
    for name, value in summary['COMMIT']['ratios'].items():
        print(
            f"{name:<20}: {value['count']:,}/{value['total']:,} "
            f"({value['percent']:.2f}%)"
        )


def _fmt(value: int | float) -> str:
    if isinstance(value, float) and not value.is_integer():
        return f'{value:,.2f}'
    return f'{int(value):,}'


def write_outputs(rows: list[dict], summary: dict, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    fieldnames = sorted({key for row in rows for key in row})
    with (output_dir / 'raw.csv').open('w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    (output_dir / 'raw.json').write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8'
    )
    (output_dir / 'summary.json').write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8'
    )


def main() -> int:
    args = parse_args()
    print(
        '토큰 카운터: osp.llm_client.count_text_tokens '
        '(LiteLLM 실패 시 해당 함수의 문자 수 기반 근사값 사용)'
    )
    print(f'표본: seed={args.seed}, 최대 {args.sample_size:,}개/대상')
    candidates = {
        'README': load_readmes(),
        'PR': load_prs(),
        'ISSUE': load_issues(),
        'COMMIT': load_commits(),
    }
    samples = {
        target: sample_rows(
            rows, target, args.sample_size, args.seed, args.full_scan
        )
        for target, rows in candidates.items()
    }
    for target in ('README', 'PR', 'ISSUE', 'COMMIT'):
        print(
            f'{target}: DB 후보 {len(candidates[target]):,}개 → '
            f'측정 {len(samples[target]):,}개'
        )

    api = ApiClient(
        args.spring_url, args.timeout, args.request_delay,
        args.cache_dir, not args.no_api_cache,
    )
    try:
        rows = []
        rows.extend(measure_readmes(samples['README'], args.progress_every))
        rows.extend(measure_issues(samples['ISSUE'], args.progress_every))
        rows.extend(measure_commits(samples['COMMIT'], api, args.progress_every))
        rows.extend(measure_prs(
            samples['PR'], api, args.progress_every, args.skip_pr_patches
        ))
    finally:
        api.close()

    summary = build_summary(rows)
    summary['metadata'] = {
        'seed': args.seed,
        'sample_size': args.sample_size,
        'full_scan': args.full_scan,
        'spring_url': args.spring_url,
        'pr_patches_skipped': args.skip_pr_patches,
        'candidate_counts': {
            target: len(values) for target, values in candidates.items()
        },
        'notes': [
            'README는 요청 정의에 따라 DB의 전체 README 원문을 측정했습니다.',
            'README llm_effective_*는 현재 평가 코드의 8,000자 제한 적용 후 실제 LLM 입력 크기입니다.',
            'PR/Issue 텍스트는 제목 + 빈 줄 + 본문입니다.',
            'Commit patch는 기존 자동 생성물 판별 후 patch가 있는 소스 파일만 포함합니다.',
            'GitHub commit files 응답은 최대 300개이므로 실제 평가와 동일하게 300개 이상을 제외합니다.',
            'PR patch 합계는 실제 에이전트가 선택할 수 있는 전체 커밋의 평가 가능 source patch 상한입니다.',
        ],
        'token_models': {
            'README_PR_ISSUE': llm_client.LLM_MODEL,
            'COMMIT_MESSAGE': llm_client.COMMIT_MESSAGE_MODEL,
            'COMMIT_PATCH': llm_client.COMMIT_CONSISTENCY_MODEL,
        },
    }
    print_summary(summary)
    write_outputs(rows, summary, args.output_dir)
    print(f'\n원자료와 요약을 저장했습니다: {args.output_dir.resolve()}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
