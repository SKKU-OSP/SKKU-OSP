import math
import statistics
from datetime import datetime, time, timedelta

from django.conf import settings
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.views import APIView

from repository.models import AiEvaluationUsage
from .ai_evaluation_usage import get_daily_usage_state, get_request_github_id


def _percentile(values: list[float], percentile: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = max(0, math.ceil(percentile * len(ordered)) - 1)
    return ordered[index]


def _distribution(values) -> dict:
    costs = [float(value) for value in values]
    if not costs:
        return {'count': 0, 'median': 0, 'p90': 0, 'p99': 0, 'max': 0}
    return {
        'count': len(costs),
        'median': statistics.median(costs),
        'p90': _percentile(costs, 0.90),
        'p99': _percentile(costs, 0.99),
        'max': max(costs),
    }


def _row(row: dict) -> dict:
    result = dict(row)
    day = result.get('day')
    if day is not None:
        result['day'] = day.isoformat()
    if result.get('total_cost') is not None:
        result['total_cost'] = float(result['total_cost'])
    return result


class AiEvaluationUsageView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            days = int(request.GET.get('days', 30))
        except (TypeError, ValueError):
            days = 30
        days = min(max(days, 1), 365)

        today = (
            timezone.localdate()
            if settings.USE_TZ
            else datetime.now().date()
        )
        first_day = today - timedelta(days=days - 1)
        start_at = datetime.combine(first_day, time.min)
        if settings.USE_TZ:
            start_at = timezone.make_aware(start_at)
        queryset = AiEvaluationUsage.objects.filter(created_at__gte=start_at)

        daily = [
            _row(row) for row in queryset.annotate(
                day=TruncDate('created_at')
            ).values('day').annotate(
                total_cost=Sum('actual_cost'),
                evaluation_count=Count('id'),
                unique_users=Count('github_id', distinct=True),
            ).order_by('day')
        ]
        daily_by_type = [
            _row(row) for row in queryset.annotate(
                day=TruncDate('created_at')
            ).values('day', 'eval_type').annotate(
                total_cost=Sum('actual_cost'),
                evaluation_count=Count('id'),
            ).order_by('day', 'eval_type')
        ]
        daily_by_user = [
            _row(row) for row in queryset.annotate(
                day=TruncDate('created_at')
            ).values('day', 'github_id').annotate(
                total_cost=Sum('actual_cost'),
                evaluation_count=Count('id'),
            ).order_by('-day', '-total_cost')
        ]

        distributions = {}
        for eval_type, _label in AiEvaluationUsage.EVAL_TYPE_CHOICES:
            distributions[eval_type] = _distribution(
                queryset.filter(eval_type=eval_type).values_list(
                    'actual_cost', flat=True
                )
            )

        totals = queryset.aggregate(
            total_cost=Sum('actual_cost'),
            evaluation_count=Count('id'),
            unique_users=Count('github_id', distinct=True),
        )
        recent = [
            {
                'id': usage.id,
                'github_id': usage.github_id,
                'eval_type': usage.eval_type,
                'target': usage.target,
                'actual_cost': float(usage.actual_cost),
                'model_name': usage.model_name,
                'status': usage.status,
                'created_at': usage.created_at.isoformat(),
            }
            for usage in queryset.order_by('-created_at')[:50]
        ]

        return JsonResponse({
            'status': 'success',
            'data': {
                'days': days,
                'period': {
                    'from': first_day.isoformat(),
                    'to': today.isoformat(),
                },
                'summary': {
                    'total_cost': float(totals['total_cost'] or 0),
                    'evaluation_count': totals['evaluation_count'],
                    'unique_users': totals['unique_users'],
                },
                'daily': daily,
                'daily_by_type': daily_by_type,
                'daily_by_user': daily_by_user,
                'cost_distribution': distributions,
                'recent': recent,
            },
        })


class AiEvaluationQuotaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return JsonResponse({
            'status': 'success',
            'data': get_daily_usage_state(get_request_github_id(request)),
        })
