"""DB 커밋 표본의 실제 source patch 토큰 분포를 측정한다."""

import argparse
import csv
import os
import random
import sys
from pathlib import Path
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            'github_commit에서 상위 또는 무작위 커밋을 골라 Spring diff API로 '
            '자동 생성물을 제외한 patch 토큰 수를 측정합니다.'
        )
    )
    parser.add_argument('--limit', type=int, default=100)
    parser.add_argument('--threshold', type=int, default=60000)
    parser.add_argument('--timeout', type=float, default=30.0)
    parser.add_argument(
        '--author',
        help='github_commit.author_github가 일치하는 작성자의 커밋만 측정합니다.',
    )
    parser.add_argument(
        '--sample-mode',
        choices=('top', 'random'),
        default='top',
        help='top: DB 변경 줄 수 상위, random: 전체 후보에서 균등 무작위 표본',
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=20260818,
        help='random 표본을 재현하기 위한 시드',
    )
    parser.add_argument(
        '--keep-duplicate-sha',
        action='store_true',
        help='fork 등에 같은 SHA가 중복 저장된 행도 각각 측정합니다.',
    )
    parser.add_argument(
        '--spring-url',
        default=settings.SPRING_BACKEND_URL,
        help='기본값: Django SPRING_BACKEND_URL 설정',
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=Path('top_commit_patch_tokens.csv'),
    )
    args = parser.parse_args()
    if args.limit <= 0:
        parser.error('--limit는 1 이상이어야 합니다.')
    if args.threshold <= 0:
        parser.error('--threshold는 1 이상이어야 합니다.')
    if args.timeout <= 0:
        parser.error('--timeout은 0보다 커야 합니다.')
    return args


def load_top_commits(
    limit: int,
    keep_duplicate_sha: bool = False,
    author: str | None = None,
) -> list[dict]:
    """머지 커밋을 제외하고 DB 변경 줄 수가 큰 순서대로 반환한다."""
    sql = """
        SELECT
            gr.owner_name,
            gr.repo_name,
            gc.sha,
            gc.message,
            COALESCE(gc.addition, 0),
            COALESCE(gc.deletion, 0)
        FROM github_commit gc
        JOIN github_repository gr ON gr.id = gc.repo_id
        WHERE gc.sha IS NOT NULL
          AND gc.sha <> ''
          AND (%s IS NULL OR LOWER(gc.author_github) = LOWER(%s))
        ORDER BY COALESCE(gc.addition, 0) + COALESCE(gc.deletion, 0) DESC,
                 gc.id DESC
        LIMIT %s
    """
    # 상위권에 머지 커밋이 섞여도 요청한 개수를 확보할 수 있게 여유 있게 읽는다.
    candidate_limit = max(limit * 20, limit)
    with connection.cursor() as cursor:
        cursor.execute(sql, [author, author, candidate_limit])
        rows = cursor.fetchall()

    commits = []
    seen_shas = set()
    for owner, repo, sha, message, additions, deletions in rows:
        if commit_service._is_merge_commit(message or ''):
            continue
        if not keep_duplicate_sha and sha in seen_shas:
            continue
        seen_shas.add(sha)
        message_lines = (message or '').splitlines()
        commits.append({
            'owner': owner,
            'repo': repo,
            'sha': sha,
            'message': message_lines[0] if message_lines else '',
            'additions': additions,
            'deletions': deletions,
            'changed_lines': additions + deletions,
        })
        if len(commits) >= limit:
            break
    return commits


def load_random_commits(
    limit: int,
    seed: int,
    keep_duplicate_sha: bool = False,
    author: str | None = None,
) -> tuple[list[dict], int]:
    """전체 비머지 후보에서 고유 SHA를 균등 무작위 추출한다."""
    sql = """
        SELECT
            gr.owner_name,
            gr.repo_name,
            gc.sha,
            gc.message,
            COALESCE(gc.addition, 0),
            COALESCE(gc.deletion, 0)
        FROM github_commit gc
        JOIN github_repository gr ON gr.id = gc.repo_id
        WHERE gc.sha IS NOT NULL
          AND gc.sha <> ''
          AND gr.owner_name IS NOT NULL
          AND gr.owner_name <> ''
          AND gr.repo_name IS NOT NULL
          AND gr.repo_name <> ''
          AND (%s IS NULL OR LOWER(gc.author_github) = LOWER(%s))
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [author, author])
        rows = cursor.fetchall()

    candidates = []
    seen_shas = set()
    for owner, repo, sha, message, additions, deletions in rows:
        if commit_service._is_merge_commit(message or ''):
            continue
        if not keep_duplicate_sha and sha in seen_shas:
            continue
        seen_shas.add(sha)
        message_lines = (message or '').splitlines()
        candidates.append({
            'owner': owner,
            'repo': repo,
            'sha': sha,
            'message': message_lines[0] if message_lines else '',
            'additions': additions,
            'deletions': deletions,
            'changed_lines': additions + deletions,
        })

    rng = random.Random(seed)
    sample_size = min(limit, len(candidates))
    return rng.sample(candidates, sample_size), len(candidates)


def fetch_files(
    session: requests.Session,
    spring_url: str,
    commit: dict,
    timeout: float,
) -> list[dict]:
    encoded = '/'.join(
        quote(str(commit[key]), safe='') for key in ('owner', 'repo', 'sha')
    )
    url = (
        f"{spring_url.rstrip('/')}"
        f"/api/v1/github/commits/{encoded}/diff"
    )
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    files = response.json().get('files') or []
    if not isinstance(files, list):
        raise ValueError('Spring diff API의 files 응답 형식이 올바르지 않습니다.')
    return [
        file for file in files
        if isinstance(file, dict) and file.get('filename')
    ]


def measure(commits: list[dict], args: argparse.Namespace) -> list[dict]:
    rows = []
    with requests.Session() as session:
        for index, commit in enumerate(commits, start=1):
            row = {
                'rank': index,
                **commit,
                'total_files': '',
                'source_files': '',
                'generated_files': '',
                'patch_files': '',
                'patch_unavailable_files': '',
                'patch_tokens': '',
                'over_threshold': '',
                'files_truncated_at_300': '',
                'error': '',
            }
            try:
                files = fetch_files(
                    session, args.spring_url, commit, args.timeout
                )
                generated_files, source_files = (
                    commit_service._split_generated_files(files)
                )
                patch_text, patch_file_count = commit_service._build_patch_text(
                    source_files
                )
                patch_tokens = (
                    llm_client.count_text_tokens(
                        patch_text,
                        model=llm_client.COMMIT_CONSISTENCY_MODEL,
                    )
                    if patch_text else 0
                )
                unavailable = sum(
                    not isinstance(file.get('patch'), str)
                    or not file.get('patch', '').strip()
                    for file in source_files
                )
                row.update({
                    'total_files': len(files),
                    'source_files': len(source_files),
                    'generated_files': len(generated_files),
                    'patch_files': patch_file_count,
                    'patch_unavailable_files': unavailable,
                    'patch_tokens': patch_tokens,
                    'over_threshold': patch_tokens > args.threshold,
                    'files_truncated_at_300': len(files) >= 300,
                })
                print(
                    f"[{index:>3}/{len(commits)}] "
                    f"{commit['owner']}/{commit['repo']} {commit['sha'][:8]} | "
                    f"lines={commit['changed_lines']:,}, files={len(files)}, "
                    f"source_patch_tokens={patch_tokens:,}",
                    flush=True,
                )
            except Exception as error:
                row['error'] = f'{type(error).__name__}: {error}'
                print(
                    f"[{index:>3}/{len(commits)}] "
                    f"{commit['owner']}/{commit['repo']} {commit['sha'][:8]} | "
                    f"ERROR {error}",
                    flush=True,
                )
            rows.append(row)
    return rows


def write_csv(rows: list[dict], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def print_summary(rows: list[dict], args: argparse.Namespace) -> None:
    successful = [row for row in rows if row['patch_tokens'] != '']
    failed = [row for row in rows if row['error']]
    over = [row for row in successful if row['over_threshold']]
    print('\n=== 측정 결과 ===')
    sample_label = (
        'DB 행' if args.keep_duplicate_sha else '고유 SHA'
    )
    if args.sample_mode == 'random':
        selection = f'전체 비머지 커밋 균등 무작위 표본, seed={args.seed}'
    else:
        selection = 'DB 변경 줄 수 상위 비머지 커밋'
    print(f'{selection}({sample_label}): {len(rows)}개')
    print(f'성공: {len(successful)}개, 실패: {len(failed)}개')
    print(f'{args.threshold:,}토큰 초과: {len(over)}개')
    for row in sorted(over, key=lambda item: item['patch_tokens'], reverse=True):
        print(
            f"- {row['owner']}/{row['repo']}@{row['sha'][:8]}: "
            f"{row['patch_tokens']:,}토큰 "
            f"({row['source_files']}개 source 파일)"
        )
    print(f'상세 CSV: {args.output.resolve()}')


def main() -> int:
    args = parse_args()
    if args.sample_mode == 'random':
        commits, candidate_count = load_random_commits(
            args.limit,
            args.seed,
            args.keep_duplicate_sha,
            args.author,
        )
        print(
            f'{candidate_count:,}개 후보 중 {len(commits)}개를 무작위 추출했습니다. '
            f'(seed={args.seed})'
        )
    else:
        commits = load_top_commits(
            args.limit,
            args.keep_duplicate_sha,
            args.author,
        )
    if not commits:
        print('측정할 커밋을 DB에서 찾지 못했습니다.', file=sys.stderr)
        return 1
    rows = measure(commits, args)
    write_csv(rows, args.output)
    print_summary(rows, args)
    return 0 if any(row['patch_tokens'] != '' for row in rows) else 2


if __name__ == '__main__':
    raise SystemExit(main())
