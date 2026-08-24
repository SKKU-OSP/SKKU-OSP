from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from osp import llm_client
from osp import pr_evaluation_service as service


def decision(action, sha=None, reason='테스트 판단'):
    value = llm_client.PrCohesionAgentDecision(
        action=action, sha=sha, reason=reason
    )
    value._actual_model = 'claude-sonnet-test'
    return value


def final_result(result='cohesive', summaries=None):
    value = llm_client.PrCohesionResult(
        result=result,
        summary=(
            '커밋들이 하나의 로그인 기능에 모여 있습니다.'
            if result == 'cohesive'
            else '로그인과 결제라는 무관한 목적이 섞여 있습니다.'
        ),
        evidence=['커밋 제목들이 로그인 기능과 테스트를 다룹니다.'],
        commit_summaries=[
            llm_client.PrConsistencyCommitSummary(**item)
            for item in (summaries or [])
        ],
    )
    value._actual_model = 'claude-sonnet-test'
    return value


COMMITS = [
    {
        'sha': 'a' * 40,
        'message_headline': 'feat: add login service',
        'file_count': 1,
        'additions': 10,
        'deletions': 2,
    },
    {
        'sha': 'b' * 40,
        'message_headline': '수정',
        'file_count': 1,
        'additions': 5,
        'deletions': 0,
    },
]

FILES = [{
    'filename': 'src/login.py',
    'status': 'modified',
    'additions': 2,
    'deletions': 1,
    'patch': '@@ -1 +1 @@\n-old\n+new',
}]


@override_settings(PR_COHESION_MAX_ITERATIONS=4, PR_COHESION_MAX_TOKENS=60000)
class PrCohesionAgentTest(SimpleTestCase):

    @patch.object(llm_client, 'score_pr_cohesion')
    @patch.object(llm_client, 'choose_pr_cohesion_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_clear_titles_can_finish_without_fetching_diff(self, _list, choose, score):
        choose.return_value = decision('finish')
        score.return_value = final_result('cohesive')

        with patch.object(service, 'fetch_commit_diff') as fetch:
            result = service._run_pr_cohesion_agent(
                'octocat', 'repo', 1, 'feat: login', '로그인 기능을 추가합니다.'
            )

        self.assertEqual(result['score'], 1)
        self.assertEqual(result['status'], 'cohesive')
        self.assertEqual(result['examined_commits'], [])
        self.assertEqual(result['stop_reason'], 'agent_finished')
        fetch.assert_not_called()
        score.assert_called_once()

    @patch.object(llm_client, 'score_pr_cohesion')
    @patch.object(llm_client, 'count_text_tokens', return_value=20)
    @patch.object(service, 'fetch_commit_diff', return_value=FILES)
    @patch.object(llm_client, 'choose_pr_cohesion_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_only_ambiguous_commit_is_fetched(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.side_effect = [
            decision('fetch_commit_diff', 'b' * 40),
            decision('finish'),
        ]
        score.return_value = final_result('cohesive', summaries=[{
            'sha': 'b' * 40,
            'summary': '로그인 테스트를 수정했습니다.',
        }])

        result = service._run_pr_cohesion_agent(
            'octocat', 'repo', 1, 'feat: login', '로그인 기능을 추가합니다.'
        )

        fetch.assert_called_once_with('octocat', 'repo', 'b' * 40)
        self.assertEqual(result['examined_commits'], ['b' * 40])
        self.assertEqual(result['commits'][1]['summary'], '로그인 테스트를 수정했습니다.')
        self.assertEqual(result['commits'][0]['status'], 'not_selected')

    @override_settings(PR_COHESION_MAX_ITERATIONS=3, PR_COHESION_MAX_TOKENS=1000)
    @patch.object(llm_client, 'score_pr_cohesion')
    @patch.object(llm_client, 'count_text_tokens', side_effect=[1200, 400])
    @patch.object(service, 'fetch_commit_diff', return_value=FILES)
    @patch.object(llm_client, 'choose_pr_cohesion_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_over_budget_commit_is_skipped_and_loop_continues(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.side_effect = [
            decision('fetch_commit_diff', 'a' * 40),
            decision('fetch_commit_diff', 'b' * 40),
            decision('finish'),
        ]
        score.return_value = final_result('cohesive')

        result = service._run_pr_cohesion_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertEqual(result['examined_commits'], ['b' * 40])
        self.assertEqual(result['attempted_commits'], ['a' * 40, 'b' * 40])
        self.assertEqual(result['commits'][0]['status'], 'token_limit')
        self.assertEqual(result['commits'][1]['status'], 'success')
        self.assertEqual(fetch.call_count, 2)

    @patch.object(llm_client, 'score_pr_cohesion')
    @patch.object(llm_client, 'count_text_tokens', return_value=20)
    @patch.object(service, 'fetch_commit_diff')
    @patch.object(llm_client, 'choose_pr_cohesion_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_fetch_failure_and_duplicate_do_not_stop_loop(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.side_effect = [
            decision('fetch_commit_diff', 'a' * 40),
            decision('fetch_commit_diff', 'a' * 40),
            decision('fetch_commit_diff', 'b' * 40),
            decision('finish'),
        ]
        fetch.side_effect = [RuntimeError('temporary error'), FILES]
        score.return_value = final_result('cohesive')

        result = service._run_pr_cohesion_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertEqual(fetch.call_count, 2)
        self.assertEqual(result['attempted_commits'], ['a' * 40, 'b' * 40])
        final_observations = score.call_args.args[-1]
        self.assertEqual(final_observations[0]['status'], 'error')
        self.assertEqual(final_observations[1]['status'], 'duplicate')
        self.assertEqual(final_observations[2]['status'], 'success')

    @override_settings(PR_COHESION_MAX_ITERATIONS=1)
    @patch.object(llm_client, 'score_pr_cohesion')
    @patch.object(llm_client, 'count_text_tokens', return_value=20)
    @patch.object(service, 'fetch_commit_diff')
    @patch.object(llm_client, 'choose_pr_cohesion_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_three_hundred_files_are_skipped_then_final_uses_titles(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.return_value = decision('fetch_commit_diff', 'b' * 40)
        fetch.return_value = [FILES[0]] * 300
        score.return_value = final_result('cohesive')

        result = service._run_pr_cohesion_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertEqual(result['score'], 1)
        self.assertEqual(result['commits'][1]['status'], 'unavailable')
        self.assertEqual(result['stop_reason'], 'max_iterations')
        _tokens.assert_not_called()
        score.assert_called_once()

    @patch.object(llm_client, 'score_pr_cohesion')
    @patch.object(llm_client, 'choose_pr_cohesion_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_scattered_is_zero_points(self, _list, choose, score):
        choose.return_value = decision('finish')
        score.return_value = final_result('scattered')

        result = service._run_pr_cohesion_agent(
            'octocat', 'repo', 1, '작업 모음', '로그인과 결제를 변경합니다.'
        )

        self.assertEqual(result['score'], 0)
        self.assertEqual(result['status'], 'scattered')

    @patch.object(service, 'list_pr_commits', side_effect=RuntimeError('API error'))
    def test_commit_list_failure_returns_na(self, _list):
        result = service._run_pr_cohesion_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertIsNone(result['score'])
        self.assertEqual(result['status'], 'N/A')
        self.assertEqual(result['stop_reason'], 'list_pr_commits_failed')

    def test_cohesion_status_and_reason_are_added_to_sentence_inputs(self):
        fulfilment = llm_client.PrFulfilmentResult(
            what='satisfied', what_reason='변경 내용이 명확함',
            why='satisfied', why_reason='변경 이유가 명확함',
            verification='satisfied', verification_reason='검증 방법이 있음',
        )
        clarity = llm_client.PrClarityResult(
            title_specificity='satisfied', title_specificity_reason='제목이 명확함',
            title_body_match='satisfied', title_body_match_reason='서로 일치함',
            single_focus='satisfied', single_focus_reason='하나에 집중함',
        )

        cohesive_good, cohesive_bad = service._build_sentence_inputs(
            fulfilment, clarity, [], [],
            cohesion_status='cohesive', cohesion_reason='하나의 기능에 모임',
        )
        scattered_good, scattered_bad = service._build_sentence_inputs(
            fulfilment, clarity, [], [],
            cohesion_status='scattered', cohesion_reason='로그인과 결제가 섞임',
        )

        self.assertIn(
            {'label': 'PR 응집성', 'reason': '하나의 기능에 모임'}, cohesive_good
        )
        self.assertFalse(any('응집성' in item['label'] for item in cohesive_bad))
        self.assertTrue(any('응집성' in item['label'] for item in scattered_bad))
        self.assertFalse(any('응집성' in item['label'] for item in scattered_good))

    def test_nine_point_grade_cutoffs(self):
        self.assertEqual(service._to_grade(7.5, 9), 'A+')
        self.assertEqual(service._to_grade(5.0, 9), 'A')
        self.assertEqual(service._to_grade(3.0, 9), 'B')
        self.assertEqual(service._to_grade(1.5, 9), 'C')
        self.assertEqual(service._to_grade(1.0, 9), 'D')
