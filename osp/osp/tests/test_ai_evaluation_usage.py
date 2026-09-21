import json
from concurrent.futures import ThreadPoolExecutor
from contextvars import copy_context
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from osp.ai_evaluation_usage_views import (
    AiEvaluationAccessView,
    AiEvaluationQuotaView,
    AiEvaluationUsageView,
    _distribution,
)
from osp.ai_proxy_views import AiEvaluationProxyView
from osp.commit_evaluation_views import (
    CommitCountsView,
    CommitEvaluationView,
    CommitFileSummariesView,
    CommitListView,
)
from osp.issue_evaluation_views import (
    IssueCountsView,
    IssueEvaluationView,
    IssueListView,
)
from osp.pr_evaluation_views import (
    PrCountsView,
    PrEvaluationProgressView,
    PrEvaluationView,
    PrListView,
)
from osp.ai_evaluation_usage import (
    capture_llm_call,
    DAILY_EVALUATION_LIMITS,
    DAILY_TOTAL_COST_LIMIT,
    enforce_daily_limit,
    EvaluationLimitExceeded,
    evaluation_status,
    get_daily_usage_state,
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
    @patch('osp.ai_evaluation_usage.AiEvaluationUsage.objects.filter')
    def test_failed_and_code_only_do_not_use_quota_but_cost_still_counts(self, filter_usage):
        today_usage = MagicMock()
        filter_usage.return_value = today_usage
        today_usage.filter.return_value.exclude.return_value.values.return_value.annotate.return_value.__iter__.return_value = iter([
            {'eval_type': 'readme', 'count': 1},
        ])
        today_usage.aggregate.return_value = {'total': Decimal('0.25')}

        state = get_daily_usage_state('runner')

        today_usage.filter.assert_called_once_with(github_id='runner')
        today_usage.filter.return_value.exclude.assert_called_once_with(
            status__in=('failed', 'code_only')
        )
        self.assertEqual(state['limits']['readme']['used'], 1)
        self.assertEqual(state['limits']['readme']['remaining'], 9)
        self.assertEqual(state['circuit_breaker']['actual_cost'], 0.25)
        today_usage.aggregate.assert_called_once()

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


@override_settings(AI_EVALUATION_ALLOWED_USER_IDS=frozenset({1}))
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

    def test_non_allowlisted_user_is_rejected_from_all_evaluation_endpoints(self):
        get_views = (
            AiEvaluationProxyView,
            PrCountsView,
            PrListView,
            PrEvaluationView,
            PrEvaluationProgressView,
            IssueCountsView,
            IssueListView,
            IssueEvaluationView,
            CommitCountsView,
            CommitListView,
            CommitEvaluationView,
            AiEvaluationQuotaView,
        )
        denied_user = SimpleNamespace(
            is_authenticated=True,
            is_superuser=False,
            pk=2,
        )
        for view in get_views:
            with self.subTest(view=view.__name__):
                request = self.factory.get('/v2/ai-evaluation/test')
                force_authenticate(request, user=denied_user)
                response = view.as_view()(request)
                self.assertEqual(response.status_code, 403)

        request = self.factory.post(
            '/v2/ai-evaluation/commit-file-summaries', {}, format='json'
        )
        force_authenticate(request, user=denied_user)
        response = CommitFileSummariesView.as_view()(request)
        self.assertEqual(response.status_code, 403)

    def test_access_endpoint_reports_allowlist_and_superuser_access(self):
        cases = (
            (1, False, True),
            (2, False, False),
            (999, True, True),
        )
        for user_id, is_superuser, expected in cases:
            with self.subTest(user_id=user_id, is_superuser=is_superuser):
                request = self.factory.get('/v2/ai-evaluation/access')
                force_authenticate(request, user=SimpleNamespace(
                    is_authenticated=True,
                    is_superuser=is_superuser,
                    pk=user_id,
                ))
                response = AiEvaluationAccessView.as_view()(request)
                data = json.loads(response.content)['data']
                self.assertEqual(response.status_code, 200)
                self.assertEqual(data['allowed'], expected)
                self.assertEqual(data['isAdmin'], is_superuser)

    @patch('osp.ai_proxy_views.svc.evaluate')
    @patch('osp.ai_proxy_views.enforce_daily_limit')
    @patch('osp.ai_proxy_views.svc.get_evaluation', return_value=None)
    def test_limit_response_stops_evaluation_before_llm_call(
        self, _get_evaluation, enforce_limit, evaluate
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

    def test_existing_results_are_shared_without_llm_or_quota_usage(self):
        cases = (
            (AiEvaluationProxyView, 'osp.ai_proxy_views', 'readme',
             {'githubUsername': 'octocat', 'repoName': 'repo'},
             {'evaluation_status': 'full'}),
            (PrEvaluationView, 'osp.pr_evaluation_views', 'pr',
             {'githubUsername': 'octocat', 'repoName': 'repo', 'prNumber': 1},
             {'evaluated': True}),
            (IssueEvaluationView, 'osp.issue_evaluation_views', 'issue',
             {'githubUsername': 'octocat', 'repoName': 'repo', 'issueNumber': 1},
             {'evaluated': True}),
            (CommitEvaluationView, 'osp.commit_evaluation_views', 'commit',
             {'githubUsername': 'octocat', 'repoName': 'repo', 'sha': 'abc'},
             {'evaluated': True}),
        )
        for view, module, eval_type, payload, cached in cases:
            with self.subTest(eval_type=eval_type), \
                    patch(f'{module}.svc.get_evaluation', return_value=cached), \
                    patch(f'{module}.svc.evaluate') as evaluate, \
                    patch(f'{module}.enforce_daily_limit') as enforce_limit, \
                    patch(f'{module}.track_evaluation') as track:
                request = self.factory.post(
                    f'/v2/ai-evaluation/{eval_type}', payload, format='json'
                )
                force_authenticate(request, user=SimpleNamespace(
                    is_authenticated=True, username='runner', pk=1,
                    account=SimpleNamespace(github_id='runner'),
                ))

                response = view.as_view()(request)

                self.assertEqual(response.status_code, 200)
                self.assertTrue(json.loads(response.content)['cached'])
                evaluate.assert_not_called()
                enforce_limit.assert_not_called()
                track.assert_not_called()

    @patch('osp.ai_proxy_views.track_evaluation')
    @patch('osp.ai_proxy_views.enforce_daily_limit')
    @patch('osp.ai_proxy_views.svc.evaluate', return_value={'evaluation_status': 'full'})
    @patch('osp.ai_proxy_views.svc.get_evaluation')
    def test_explicit_reevaluation_bypasses_cache(
        self, get_evaluation, evaluate, enforce_limit, track
    ):
        request = self.factory.post(
            '/v2/ai-evaluation/readme',
            {'githubUsername': 'octocat', 'repoName': 'repo', 'forceReevaluate': True},
            format='json',
        )
        force_authenticate(request, user=SimpleNamespace(
            is_authenticated=True, username='runner', pk=1,
            account=SimpleNamespace(github_id='runner'),
        ))

        response = AiEvaluationProxyView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        get_evaluation.assert_not_called()
        evaluate.assert_called_once_with('octocat', 'repo')
        enforce_limit.assert_called_once_with('runner', 'readme')
        track.assert_called_once()
