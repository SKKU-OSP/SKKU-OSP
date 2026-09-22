"""커밋 diff 파일 수 표본 분포를 측정한다.

기본 실행:
    cd SKKU-OSP/osp
    python measure_commit_file_distribution.py

여러 저장소가 고르게 포함되도록 저장소별 커밋 목록을 섞은 뒤
라운드로빈으로 표본을 선택한다. 각 표본은 Spring diff API를 한 번 호출한다.
"""
import argparse
import csv
import os
import random
import sys
import time
from collections import Counter, defaultdict, deque
from pathlib import Path
from urllib.parse import quote

import django
import requests


BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'osp.settings')
# django.setup() 중 crawler AppConfig가 APScheduler를 시작하지 않게 한다.
os.environ.setdefault('RUN_MAIN', 'true')
sys.path.insert(0, str(BASE_DIR))
django.setup()

from django.conf import settings  # noqa: E402
from django.db import connection  # noqa: E402


BUCKET_SMALL = 'small_1_5'
BUCKET_MEDIUM = 'medium_6_15'
BUCKET_LARGE = 'large_16_plus'


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='여러 저장소에서 커밋을 고르게 표본 추출해 변경 파일 수를 측정합니다.'
    )
    parser.add_argument('--sample-size', type=int, default=100)
    parser.add_argument('--seed', type=int, default=20260812)
    parser.add_argument('--timeout', type=float, default=20.0)
    parser.add_argument(
        '--spring-url',
        default=settings.SPRING_BACKEND_URL,
        help='기본값: Django SPRING_BACKEND_URL 설정',
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=Path('commit_file_distribution.csv'),
    )
    args = parser.parse_args()
    if args.sample_size <= 0:
        parser.error('--sample-size는 1 이상이어야 합니다.')
    if args.timeout <= 0:
        parser.error('--timeout은 0보다 커야 합니다.')
    return args


def load_commit_candidates() -> list[tuple[str, str, str]]:
    """(sha, owner, repo) 후보를 DB에서 중복 없이 읽는다."""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT gc.sha, gr.owner_name, gr.repo_name
            FROM github_commit gc
            JOIN github_repository gr ON gc.repo_id = gr.id
            WHERE gc.sha IS NOT NULL
              AND gc.sha <> ''
              AND gr.owner_name IS NOT NULL
              AND gr.owner_name <> ''
              AND gr.repo_name IS NOT NULL
              AND gr.repo_name <> ''
        """)
        return list(cursor.fetchall())


def balanced_sample(
    candidates: list[tuple[str, str, str]], sample_size: int, seed: int
) -> list[tuple[str, str, str]]:
    """저장소별 큐에서 하나씩 꺼내 특정 대형 저장소 편중을 방지한다."""
    rng = random.Random(seed)
    by_repo: dict[tuple[str, str], list[tuple[str, str, str]]] = defaultdict(list)
    for sha, owner, repo in candidates:
        by_repo[(owner, repo)].append((sha, owner, repo))

    repo_queues = []
    for commits in by_repo.values():
        rng.shuffle(commits)
        repo_queues.append(deque(commits))
    rng.shuffle(repo_queues)

    selected = []
    while repo_queues and len(selected) < sample_size:
        next_round = []
        for commits in repo_queues:
            selected.append(commits.popleft())
            if commits:
                next_round.append(commits)
            if len(selected) >= sample_size:
                break
        rng.shuffle(next_round)
        repo_queues = next_round
    return selected


def diff_url(base_url: str, owner: str, repo: str, sha: str) -> str:
    parts = [quote(value, safe='') for value in (owner, repo, sha)]
    return f"{base_url.rstrip('/')}/api/v1/github/commits/{'/'.join(parts)}/diff"


def bucket_for(file_count: int) -> str:
    if file_count <= 5:
        return BUCKET_SMALL
    if file_count <= 15:
        return BUCKET_MEDIUM
    return BUCKET_LARGE


def measure(
    samples: list[tuple[str, str, str]], spring_url: str, timeout: float
) -> list[dict]:
    rows = []
    with requests.Session() as session:
        for index, (sha, owner, repo) in enumerate(samples, start=1):
            url = diff_url(spring_url, owner, repo, sha)
            started = time.monotonic()
            row = {
                'index': index,
                'owner': owner,
                'repo': repo,
                'sha': sha,
                'file_count': '',
                'bucket': '',
                'is_300_plus': False,
                'http_status': '',
                'elapsed_ms': '',
                'error': '',
            }
            try:
                response = session.get(url, timeout=timeout)
                row['http_status'] = response.status_code
                response.raise_for_status()
                files = response.json().get('files') or []
                file_count = len(files)
                row['file_count'] = file_count
                row['bucket'] = bucket_for(file_count)
                # GitHub commit detail API의 파일 목록 상한에 닿은 표본.
                row['is_300_plus'] = file_count >= 300
                status = f"{file_count} files"
                if row['is_300_plus']:
                    status = '300+ files'
                print(f"[{index:>3}/{len(samples)}] {owner}/{repo} {sha[:8]}: {status}")
            except Exception as exc:
                row['error'] = f'{type(exc).__name__}: {exc}'
                print(f"[{index:>3}/{len(samples)}] {owner}/{repo} {sha[:8]}: ERROR {exc}")
            finally:
                row['elapsed_ms'] = round((time.monotonic() - started) * 1000)
            rows.append(row)
    return rows


def write_csv(rows: list[dict], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def print_summary(rows: list[dict], candidate_count: int, repo_count: int) -> None:
    successful = [row for row in rows if row['bucket']]
    failures = [row for row in rows if row['error']]
    counts = Counter(row['bucket'] for row in successful)
    denominator = len(successful)

    print('\n=== 측정 결과 ===')
    print(f'DB 후보: {candidate_count:,}개 커밋 / {repo_count:,}개 저장소')
    print(f'표본: {len(rows)}개, 성공: {denominator}개, 실패: {len(failures)}개')
    for bucket, label in (
        (BUCKET_SMALL, '5개 이하'),
        (BUCKET_MEDIUM, '6~15개'),
        (BUCKET_LARGE, '15개 초과'),
    ):
        count = counts[bucket]
        percent = count / denominator * 100 if denominator else 0.0
        print(f'{label:>8}: {count:>3}개 ({percent:5.1f}%)')
    capped = sum(bool(row['is_300_plus']) for row in successful)
    print(f'    300+: {capped:>3}개')

    if denominator:
        large_ratio = counts[BUCKET_LARGE] / denominator
        if large_ratio < 0.10:
            conclusion = 'large 비율이 10% 미만: 규칙 기반 처리 우선 검토'
        elif large_ratio >= 0.20:
            conclusion = 'large 비율이 20% 이상: 파일 선별 전략 검토 가치가 큼'
        else:
            conclusion = 'large 비율이 10~20%: 품질·비용 실험 후 결정 권장'
        print(f'판단: {conclusion}')


def main() -> int:
    args = parse_args()
    candidates = load_commit_candidates()
    if not candidates:
        print('측정 가능한 커밋이 DB에 없습니다.', file=sys.stderr)
        return 1

    repo_count = len({(owner, repo) for _, owner, repo in candidates})
    samples = balanced_sample(candidates, args.sample_size, args.seed)
    print(
        f'{len(candidates):,}개 커밋/{repo_count:,}개 저장소 중 '
        f'{len(samples)}개를 표본으로 선택했습니다. (seed={args.seed})'
    )
    print(f'Spring API: {args.spring_url}')

    rows = measure(samples, args.spring_url, args.timeout)
    write_csv(rows, args.output)
    print_summary(rows, len(candidates), repo_count)
    print(f'상세 CSV: {args.output.resolve()}')
    return 0 if any(row['bucket'] for row in rows) else 2


if __name__ == '__main__':
    raise SystemExit(main())
