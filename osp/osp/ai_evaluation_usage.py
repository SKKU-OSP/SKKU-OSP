"""평가 요청 단위 LLM 비용 추적과 best-effort DB 적재."""
from __future__ import annotations

import logging
import re
import threading
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import datetime, time, timedelta
from decimal import Decimal, InvalidOperation
from typing import Iterator

from django.conf import settings
from django.db.models import Count, Sum
from django.utils import timezone

from repository.models import AiEvaluationUsage

logger = logging.getLogger(__name__)

DAILY_EVALUATION_LIMITS = {
    'readme': 50,
    'pr': 50,
    'issue': 50,
    'commit': 50,
}
DAILY_TOTAL_COST_LIMIT = Decimal('8.00')
# 평가 결과를 받지 못한 시도는 개인별 일일 횟수에서 제외한다.
# 실제 발생한 LLM 비용은 상태와 무관하게 전체 비용에 계속 합산한다.
NON_CHARGEABLE_STATUSES = ('failed', 'code_only', 'rejected')

_ERROR_MESSAGE_MAX_LENGTH = 2000
_SENSITIVE_PATTERNS = (
    re.compile(r'(?i)(authorization\s*[:=]\s*)(?:bearer\s+)?[^\s,;]+'),
    re.compile(r'(?i)((?:api[_-]?key|token|secret|password)\s*[:=]\s*)[^\s,;]+'),
    re.compile(r'\bsk-ant-[A-Za-z0-9_-]+\b'),
    re.compile(r'\bgh[pousr]_[A-Za-z0-9_]+\b'),
)

_current_tracker: ContextVar['AiEvaluationUsageTracker | None'] = ContextVar(
    'ai_evaluation_usage_tracker', default=None
)


def _cost_decimal(value: float) -> Decimal:
    try:
        return Decimal(str(value or 0))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal('0')


def sanitize_error_message(error: Exception | str) -> str:
    """운영 DB에 저장할 수 있도록 비밀값을 제거하고 길이를 제한한다."""
    message = str(error or '').replace('\x00', '').strip()
    for pattern in _SENSITIVE_PATTERNS:
        if pattern.groups:
            message = pattern.sub(r'\1[REDACTED]', message)
        else:
            message = pattern.sub('[REDACTED]', message)
    return message[:_ERROR_MESSAGE_MAX_LENGTH]


def classify_evaluation_error(error: Exception) -> tuple[str, str]:
    """예외를 관리자 집계에 사용할 안정적인 분류와 코드로 변환한다."""
    message = str(error or '')
    lowered = message.lower()
    status_code = getattr(error, 'status_code', None)
    response = getattr(error, 'response', None)
    if status_code is None and response is not None:
        status_code = getattr(response, 'status_code', None)
    code = str(status_code or getattr(error, 'code', '') or type(error).__name__)

    if 'readme가 없는' in lowered or '본문이 없습니다' in message:
        return 'missing_content', code
    if 'credit balance is too low' in lowered or 'insufficient credit' in lowered:
        return 'llm_credit', code
    if status_code in (401, 403) or 'invalid api key' in lowered or 'authentication' in lowered:
        return 'llm_auth', code
    if status_code == 429 or 'resource_exhausted' in lowered or 'rate limit' in lowered:
        return 'llm_rate_limit', code
    if 'timed out' in lowered or 'timeout' in lowered:
        return 'timeout', code
    if (
        'validation error' in lowered
        or '파싱 실패' in message
        or 'json decode' in lowered
        or '응답 형식이 올바르지 않습니다' in message
    ):
        return 'response_parse', code
    if 'context length' in lowered or 'token limit' in lowered or 'too many tokens' in lowered:
        return 'token_limit', code
    if (
        status_code in (502, 503, 504, 529)
        or 'connection refused' in lowered
        or 'failed to establish a new connection' in lowered
        or 'unavailable' in lowered
        or 'high demand' in lowered
    ):
        return 'dependency_unavailable', code
    if status_code in (400, 404) or '찾을 수 없습니다' in message:
        return 'invalid_target', code
    return 'internal_error', code


def _today_range() -> tuple[datetime, datetime]:
    now = timezone.now() if settings.USE_TZ else datetime.now()
    start = datetime.combine(now.date(), time.min)
    end = start + timedelta(days=1)
    if settings.USE_TZ:
        start = timezone.make_aware(start)
        end = timezone.make_aware(end)
    return start, end


def get_daily_usage_state(github_id: str) -> dict:
    start, end = _today_range()
    today_usage = AiEvaluationUsage.objects.filter(
        created_at__gte=start,
        created_at__lt=end,
    )
    counts = {
        row['eval_type']: row['count']
        for row in today_usage.filter(github_id=github_id).exclude(
            status__in=NON_CHARGEABLE_STATUSES
        ).values(
            'eval_type'
        ).annotate(count=Count('id'))
    }
    total_cost = today_usage.aggregate(total=Sum('actual_cost'))['total'] or Decimal('0')
    global_blocked = total_cost >= DAILY_TOTAL_COST_LIMIT
    limits = {}
    for eval_type, limit in DAILY_EVALUATION_LIMITS.items():
        used = int(counts.get(eval_type, 0))
        limits[eval_type] = {
            'used': used,
            'limit': limit,
            'remaining': max(0, limit - used),
            'blocked': used >= limit or global_blocked,
        }
    return {
        'date': start.date().isoformat(),
        'reset_at': end.isoformat(),
        'limits': limits,
        'circuit_breaker': {
            'actual_cost': float(total_cost),
            'limit': float(DAILY_TOTAL_COST_LIMIT),
            'remaining': float(max(Decimal('0'), DAILY_TOTAL_COST_LIMIT - total_cost)),
            'blocked': global_blocked,
        },
    }


class EvaluationLimitExceeded(Exception):
    def __init__(self, message: str, reason: str, usage_state: dict):
        super().__init__(message)
        self.reason = reason
        self.usage_state = usage_state


def enforce_daily_limit(github_id: str, eval_type: str) -> dict:
    state = get_daily_usage_state(github_id)
    if state['circuit_breaker']['blocked']:
        raise EvaluationLimitExceeded(
            '오늘 AI 평가 서비스의 전체 사용 한도에 도달했습니다. '
            '내일 00:00부터 다시 이용해 주세요.',
            'daily_cost_limit',
            state,
        )
    quota = state['limits'][eval_type]
    if quota['used'] >= quota['limit']:
        label = {
            'readme': 'README', 'pr': 'PR', 'issue': '이슈', 'commit': '커밋'
        }[eval_type]
        raise EvaluationLimitExceeded(
            f'오늘 {label} AI 평가 {quota["limit"]}회를 모두 사용했습니다. '
            '내일 00:00부터 다시 이용해 주세요.',
            'user_daily_limit',
            state,
        )
    return state


@dataclass
class AiEvaluationUsageTracker:
    github_id: str
    eval_type: str
    target: dict
    status: str = 'failed'
    actual_cost: Decimal = Decimal('0')
    models: list[str] = field(default_factory=list)
    error_stage: str = ''
    error_category: str = ''
    error_code: str = ''
    error_message: str = ''
    current_stage: str = 'evaluation'
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def add_call(self, actual_cost: float, model_name: str | None) -> None:
        with self._lock:
            self.actual_cost += _cost_decimal(actual_cost)
            if model_name and model_name not in self.models:
                self.models.append(model_name)

    def complete(self, status: str = 'full') -> None:
        self.status = status

    def set_stage(self, stage: str) -> None:
        self.current_stage = (stage or 'evaluation')[:64]

    def record_error(
        self,
        error: Exception,
        *,
        stage: str = '',
        status: str | None = None,
    ) -> None:
        category, code = classify_evaluation_error(error)
        with self._lock:
            self.error_stage = (stage or self.current_stage or 'evaluation')[:64]
            self.error_category = category[:64]
            self.error_code = code[:128]
            self.error_message = sanitize_error_message(error)
            if status is not None:
                self.status = status
            elif category in {'missing_content', 'invalid_target'}:
                self.status = 'rejected'
            else:
                self.status = 'failed'

    def persist(self) -> None:
        try:
            usage = AiEvaluationUsage.objects.create(
                github_id=self.github_id[:40],
                eval_type=self.eval_type,
                target=self.target,
                actual_cost=self.actual_cost,
                model_name=', '.join(self.models)[:512],
                status=self.status,
                error_stage=self.error_stage,
                error_category=self.error_category,
                error_code=self.error_code,
                error_message=self.error_message,
            )
            logger.info(
                '[AI 사용량 기록] id=%s | user=%s | type=%s | status=%s '
                '| total=$%s | models=%s | error=%s/%s',
                usage.pk,
                self.github_id,
                self.eval_type,
                self.status,
                self.actual_cost,
                ', '.join(self.models) or '-',
                self.error_stage or '-',
                self.error_category or '-',
            )
        except Exception:
            # 사용량 기록 장애가 사용자 평가 응답을 막아서는 안 된다.
            logger.exception(
                '[AI 사용량 기록 실패] user=%s | type=%s | status=%s '
                '| cost=$%s',
                self.github_id,
                self.eval_type,
                self.status,
                self.actual_cost,
            )


@contextmanager
def track_evaluation(
    github_id: str,
    eval_type: str,
    target: dict,
    stage: str = 'evaluation',
) -> Iterator[AiEvaluationUsageTracker]:
    tracker = AiEvaluationUsageTracker(
        github_id=github_id or 'anonymous',
        eval_type=eval_type,
        target=target,
        current_stage=stage,
    )
    token = _current_tracker.set(tracker)
    try:
        yield tracker
    except Exception as error:
        tracker.record_error(error)
        raise
    finally:
        _current_tracker.reset(token)
        tracker.persist()


def capture_llm_call(actual_cost: float, model_name: str | None) -> None:
    """현재 평가 요청에 실제 완료된 LLM 호출 비용을 더한다."""
    tracker = _current_tracker.get()
    if tracker is not None:
        tracker.add_call(actual_cost, model_name)


def capture_evaluation_error(
    error: Exception,
    stage: str,
    status: str | None = None,
) -> None:
    """복구 가능한 부분 실패도 현재 평가 레코드에 함께 남긴다."""
    tracker = _current_tracker.get()
    if tracker is not None:
        tracker.record_error(error, stage=stage, status=status)


def get_request_github_id(request) -> str:
    """평가 대상과 독립적인, 평가를 실행한 로그인 계정 식별자."""
    user = getattr(request, 'user', None)
    if not user or not getattr(user, 'is_authenticated', False):
        return 'anonymous'
    account = getattr(user, 'account', None)
    return (getattr(account, 'github_id', None) or user.username or str(user.pk))


def evaluation_status(result: dict, eval_type: str) -> str:
    if eval_type == 'readme':
        return result.get('evaluation_status') or 'full'
    if eval_type == 'issue' and result.get('issue_type') == 'skip':
        return 'skipped'
    if eval_type == 'commit':
        breakdown = result.get('commit_breakdown') or {}
        if result.get('evaluation_status') == 'skipped':
            return 'skipped'
        if breakdown.get('evaluation_status') == 'skipped':
            return 'skipped'
    return 'full'
