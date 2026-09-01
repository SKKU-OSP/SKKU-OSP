"""분포 분위수와 가까운 실제 항목을 평가해 비용 추정치를 검증한다.

기본 실행은 후보만 출력한다. --execute를 지정해야 유료 LLM 호출을 수행하며,
평가 서비스의 DB 저장은 각 평가 후 트랜잭션으로 롤백한다.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import re
import sys
from pathlib import Path

import django


BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'osp.settings')
os.environ.setdefault('RUN_MAIN', 'true')
sys.path.insert(0, str(BASE_DIR))
django.setup()

from django.db import transaction  # noqa: E402

from osp import commit_evaluation_service  # noqa: E402
from osp import issue_evaluation_service  # noqa: E402
from osp import pr_evaluation_service  # noqa: E402
from osp import readme_evaluation_service  # noqa: E402


METRICS = {
    'ISSUE': 'input_tokens',
    'README': 'llm_effective_tokens',
    'COMMIT': 'input_tokens',
    'PR': 'pr_patch_tokens',
}
ESTIMATED_COSTS = {
    'ISSUE': {'median': 0.007, 'p90': 0.008, 'p99': 0.012},
    'README': {'median': 0.008, 'p90': 0.012, 'p99': 0.015},
    'COMMIT': {'median': 0.019, 'p90': 0.058, 'p99': 0.223},
    'PR': {'median': 0.059, 'p90': 0.210, 'p99': 0.255},
}
TOTAL_COST_RE = re.compile(r'\[LLM 총 비용\].*?total=\$([0-9.]+)')


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--distribution-dir', type=Path,
        default=Path('ai_input_distribution'),
    )
    parser.add_argument(
        '--targets', nargs='+', choices=tuple(METRICS),
        default=list(METRICS),
    )
    parser.add_argument(
        '--quantiles', nargs='+', choices=('median', 'p90', 'p99'),
        default=['median', 'p90', 'p99'],
    )
    parser.add_argument(
        '--execute', action='store_true',
        help='실제 유료 LLM 평가를 실행합니다.',
    )
    parser.add_argument(
        '--output', type=Path, default=Path('ai_cost_validation.json'),
    )
    return parser.parse_args()


def load_candidates(distribution_dir: Path) -> tuple[list[dict], dict]:
    with (distribution_dir / 'raw.csv').open(encoding='utf-8') as file:
        rows = list(csv.DictReader(file))
    summary = json.loads(
        (distribution_dir / 'summary.json').read_text(encoding='utf-8')
    )
    return rows, summary


def select_cases(
    rows: list[dict], summary: dict,
    targets: list[str], quantiles: list[str],
) -> list[dict]:
    selected = []
    for target in targets:
        metric = METRICS[target]
        candidates = []
        for row in rows:
            if row.get('target') != target or row.get('status') != 'measured':
                continue
            try:
                value = float(row.get(metric, ''))
            except (TypeError, ValueError):
                continue
            candidates.append((value, row))
        for quantile in quantiles:
            wanted = float(summary[target]['metrics'][metric][quantile])
            actual, row = min(candidates, key=lambda item: abs(item[0] - wanted))
            selected.append({
                'target': target,
                'quantile': quantile,
                'metric': metric,
                'target_tokens': wanted,
                'sample_tokens': actual,
                'owner': row['owner'],
                'repo': row['repo'],
                'identifier': row['identifier'],
                'commit_count': _optional_number(row.get('commit_count')),
                'estimated_cost': ESTIMATED_COSTS[target][quantile],
            })
    return selected


def _optional_number(value: str | None):
    if value in (None, ''):
        return None
    return int(float(value))


class CostCapture(logging.Handler):
    def __init__(self) -> None:
        super().__init__(logging.INFO)
        self.messages: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        message = record.getMessage()
        if '[LLM 총 비용]' in message:
            self.messages.append(message)


def evaluate_case(case: dict, capture: CostCapture) -> dict:
    before = len(capture.messages)
    target = case['target']
    owner = case['owner']
    repo = case['repo']
    identifier = case['identifier']
    try:
        with transaction.atomic():
            if target == 'README':
                readme_evaluation_service.evaluate(owner, repo)
            elif target == 'ISSUE':
                issue_evaluation_service.evaluate(owner, repo, int(identifier))
            elif target == 'COMMIT':
                commit_evaluation_service.evaluate(owner, repo, identifier)
            elif target == 'PR':
                pr_evaluation_service.evaluate(owner, repo, int(identifier))
            transaction.set_rollback(True)
        new_messages = capture.messages[before:]
        cost_message = next(
            (message for message in reversed(new_messages)
             if TOTAL_COST_RE.search(message)),
            '',
        )
        match = TOTAL_COST_RE.search(cost_message)
        if not match:
            raise RuntimeError('평가 완료 로그에서 총비용을 찾지 못했습니다.')
        actual_cost = float(match.group(1))
        estimated = case['estimated_cost']
        return {
            **case,
            'status': 'success',
            'actual_cost': actual_cost,
            'difference': round(actual_cost - estimated, 6),
            'ratio_to_estimate': round(actual_cost / estimated, 3) if estimated else None,
            'cost_log': cost_message,
        }
    except Exception as error:
        return {
            **case,
            'status': 'error',
            'error': f'{type(error).__name__}: {error}',
        }


def print_cases(cases: list[dict]) -> None:
    print(
        f"{'대상':<8} {'분위':<8} {'표본 토큰':>12} {'예상 비용':>12} "
        f"{'실제 비용':>12} {'배율':>9}  항목"
    )
    print('-' * 100)
    for case in cases:
        item = f"{case['owner']}/{case['repo']}#{case['identifier']}"
        actual = case.get('actual_cost')
        ratio = case.get('ratio_to_estimate')
        print(
            f"{case['target']:<8} {case['quantile']:<8} "
            f"{case['sample_tokens']:>12,.0f} ${case['estimated_cost']:>11.3f} "
            f"{('$' + format(actual, '.6f')) if actual is not None else '-':>12} "
            f"{(format(ratio, '.2f') + 'x') if ratio is not None else '-':>9}  {item}"
        )
        if case.get('error'):
            print(f"  ERROR: {case['error']}")


def main() -> int:
    args = parse_args()
    rows, summary = load_candidates(args.distribution_dir)
    cases = select_cases(rows, summary, args.targets, args.quantiles)
    if not args.execute:
        print('실제 LLM 호출은 하지 않았습니다. 실행하려면 --execute를 추가하세요.\n')
        print_cases(cases)
        return 0

    capture = CostCapture()
    root = logging.getLogger()
    previous_level = root.level
    root.addHandler(capture)
    root.setLevel(logging.INFO)
    try:
        results = []
        for index, case in enumerate(cases, 1):
            print(
                f"[{index}/{len(cases)}] {case['target']} {case['quantile']} "
                f"{case['owner']}/{case['repo']}#{case['identifier']} 평가 중...",
                flush=True,
            )
            results.append(evaluate_case(case, capture))
    finally:
        root.removeHandler(capture)
        root.setLevel(previous_level)

    args.output.write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8'
    )
    print('\n=== 비용 검증 결과 ===')
    print_cases(results)
    print(f'\n결과 저장: {args.output.resolve()}')
    return 1 if any(row['status'] == 'error' for row in results) else 0


if __name__ == '__main__':
    raise SystemExit(main())
