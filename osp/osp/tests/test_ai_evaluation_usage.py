import json
from concurrent.futures import ThreadPoolExecutor
from contextvars import copy_context
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from osp.ai_evaluation_usage_views import AiEvaluationUsageView, _distribution
from osp.ai_proxy_views import AiEvaluationProxyView
from osp.ai_evaluation_usage import (
    capture_llm_call,
    DAILY_EVALUATION_LIMITS,
    DAILY_TOTAL_COST_LIMIT,
    enforce_daily_limit,
    EvaluationLimitExceeded,
    evaluation_status,
    get_request_github_id,
    track_evaluation,
)


class AiEvaluationUsageTrackerTest(SimpleTestCase):
    @patch('osp.ai_evaluation_usage.AiEvaluationUsage.objects.create')
    def test_completed_calls_are_summed_and_actual_models_are_saved(self, create):
        with track_evaluation(
            'runner', 'pr', {'owner': 'org', 'repo': 'repo', 'pr_number': 3}
        ) as usage:
            capture_llm_call(0.0012, 'claude-sonnet')
            capture_llm_call(0.0008, 'claude-haiku')
            capture_llm_call(0.0005, 'claude-sonnet')
            usage.complete('full')

        kwargs = create.call_args.kwargs
        self.assertEqual(kwargs['github_id'], 'runner')
        self.assertEqual(kwargs['actual_cost'], Decimal('0.0025'))
        self.assertEqual(kwargs['model_name'], 'claude-sonnet, claude-haiku')
        self.assertEqual(kwargs['status'], 'full')

    @patch('osp.ai_evaluation_usage.AiEvaluationUsage.objects.create')
    def test_failure_still_persists_cost_spent_before_exception(self, create):
        with self.assertRaisesRegex(RuntimeError, 'failed'):
            with track_evaluation('runner', 'commit', {'sha': 'abc'}):
                capture_llm_call(0.003, 'claude-sonnet')
                raise RuntimeError('failed')

        kwargs = create.call_args.kwargs
        self.assertEqual(kwargs['actual_cost'], Decimal('0.003'))
        self.assertEqual(kwargs['status'], 'failed')

    @patch('osp.ai_evaluation_usage.AiEvaluationUsage.objects.create')
    def test_parallel_agent_contexts_add_to_same_evaluation(self, create):
        with track_evaluation('runner', 'pr', {'pr_number': 1}) as usage:
            with ThreadPoolExecutor(max_workers=2) as executor:
                futures = [
                    executor.submit(
                        copy_context().run,
                        capture_llm_call,
                        cost,
                        model,
                    )
                    for cost, model in (
                        (0.01, 'consistency-model'),
                        (0.02, 'cohesion-model'),
                    )
                ]
                for future in futures:
                    future.result()
            usage.complete('full')

        kwargs = create.call_args.kwargs
        self.assertEqual(kwargs['actual_cost'], Decimal('0.03'))
        self.assertCountEqual(
            kwargs['model_name'].split(', '),
            ['consistency-model', 'cohesion-model'],
        )

    @patch(
        'osp.ai_evaluation_usage.AiEvaluationUsage.objects.create',
        side_effect=RuntimeError('database unavailable'),
    )
    def test_record_failure_does_not_break_evaluation(self, _create):
        with track_evaluation('runner', 'readme', {'repo': 'repo'}) as usage:
            usage.complete('full')

    def test_request_actor_uses_logged_in_account_github_id(self):
        request = SimpleNamespace(user=SimpleNamespace(
            is_authenticated=True,
            username='admin',
            pk=1,
            account=SimpleNamespace(github_id='octocat'),
        ))
        self.assertEqual(get_request_github_id(request), 'octocat')

    def test_result_statuses_cover_partial_and_skipped_cases(self):
        self.assertEqual(
            evaluation_status({'evaluation_status': 'partial'}, 'readme'),
            'partial',
        )
        self.assertEqual(
            evaluation_status({'issue_type': 'skip'}, 'issue'),
            'skipped',
        )
        self.assertEqual(
            evaluation_status({'evaluation_status': 'skipped'}, 'commit'),
            'skipped',
        )


class AiEvaluationLimitPolicyTest(SimpleTestCase):
    def _state(self, eval_type='pr', used=0, cost=0):
        limits = {
            key: {
                'used': used if key == eval_type else 0,
                'limit': limit,
                'remaining': max(0, limit - (used if key == eval_type else 0)),
                'blocked': False,
            }
            for key, limit in DAILY_EVALUATION_LIMITS.items()
        }
        return {
            'limits': limits,
            'circuit_breaker': {
                'actual_cost': cost,
                'limit': float(DAILY_TOTAL_COST_LIMIT),
                'remaining': max(0, float(DAILY_TOTAL_COST_LIMIT) - cost),
                'blocked': cost >= float(DAILY_TOTAL_COST_LIMIT),
            },
        }

    @patch('osp.ai_evaluation_usage.get_daily_usage_state')
    def test_user_limit_blocks_at_configured_count(self, get_state):
        get_state.return_value = self._state('pr', used=3)
        with self.assertRaises(EvaluationLimitExceeded) as raised:
            enforce_daily_limit('runner', 'pr')
        self.assertEqual(raised.exception.reason, 'user_daily_limit')

    @patch('osp.ai_evaluation_usage.get_daily_usage_state')
    def test_user_limit_allows_one_before_configured_count(self, get_state):
        get_state.return_value = self._state('commit', used=4)
        state = enforce_daily_limit('runner', 'commit')
        self.assertEqual(state['limits']['commit']['remaining'], 1)

    @patch('osp.ai_evaluation_usage.get_daily_usage_state')
    def test_global_cost_limit_blocks_every_evaluation_type(self, get_state):
        get_state.return_value = self._state('issue', used=0, cost=8)
        with self.assertRaises(EvaluationLimitExceeded) as raised:
            enforce_daily_limit('runner', 'issue')
        self.assertEqual(raised.exception.reason, 'daily_cost_limit')


class AiEvaluationUsageDistributionTest(SimpleTestCase):
    def test_distribution_uses_nearest_rank_percentiles(self):
        result = _distribution([Decimal(index) for index in range(1, 101)])
        self.assertEqual(result['count'], 100)
        self.assertEqual(result['median'], 50.5)
        self.assertEqual(result['p90'], 90)
        self.assertEqual(result['p99'], 99)
        self.assertEqual(result['max'], 100)


class AiEvaluationUsagePermissionTest(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_evaluation_post_requires_login(self):
        request = self.factory.post(
            '/v2/ai-evaluation/readme',
            {'githubUsername': 'octocat', 'repoName': 'repo'},
            format='json',
        )
        response = AiEvaluationProxyView.as_view()(request)
        self.assertEqual(response.status_code, 401)

    def test_usage_dashboard_rejects_non_admin(self):
        request = self.factory.get('/v2/ai-evaluation/usage')
        force_authenticate(request, user=SimpleNamespace(
            is_authenticated=True,
            is_staff=False,
        ))
        response = AiEvaluationUsageView.as_view()(request)
        self.assertEqual(response.status_code, 403)

    @patch('osp.ai_proxy_views.svc.evaluate')
    @patch('osp.ai_proxy_views.enforce_daily_limit')
    def test_limit_response_stops_evaluation_before_llm_call(
        self, enforce_limit, evaluate
    ):
        usage_state = {
            'limits': {'readme': {'used': 10, 'limit': 10, 'blocked': True}},
            'circuit_breaker': {'blocked': False},
        }
        enforce_limit.side_effect = EvaluationLimitExceeded(
            '오늘 README AI 평가 10회를 모두 사용했습니다.',
            'user_daily_limit',
            usage_state,
        )
        request = self.factory.post(
            '/v2/ai-evaluation/readme',
            {'githubUsername': 'octocat', 'repoName': 'repo'},
            format='json',
        )
        force_authenticate(request, user=SimpleNamespace(
            is_authenticated=True,
            username='runner',
            pk=1,
            account=SimpleNamespace(github_id='runner'),
        ))

        response = AiEvaluationProxyView.as_view()(request)

        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            json.loads(response.content)['reason'], 'user_daily_limit'
        )
        evaluate.assert_not_called()
