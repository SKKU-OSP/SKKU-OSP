from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from osp import llm_client
from osp import pr_evaluation_service as service


def decision(action, sha=None, reason='테스트 판단'):
    value = llm_client.PrConsistencyAgentDecision(
        action=action, sha=sha, reason=reason
    )
    value._actual_model = 'claude-sonnet-test'
    return value


def final_result(
    result='matched', summary='PR 설명과 변경 방향이 일치합니다.',
    evidence=None, summaries=None
):
    value = llm_client.PrConsistencyResult(
        result=result,
        summary=summary,
        evidence=evidence or ['로그인 처리 변경을 확인했습니다.'],
        commit_summaries=[
            llm_client.PrConsistencyCommitSummary(**summary)
            for summary in (summaries or [])
        ],
    )
    value._actual_model = 'claude-sonnet-test'
    return value


COMMITS = [
    {
        'sha': 'a' * 40,
        'message_headline': 'feat: add login',
        'file_count': 1,
        'additions': 10,
        'deletions': 2,
    },
    {
        'sha': 'b' * 40,
        'message_headline': 'test: login',
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


@override_settings(PR_CONSISTENCY_MAX_ITERATIONS=4, PR_CONSISTENCY_MAX_TOKENS=30000)
class PrConsistencyAgentTest(SimpleTestCase):

    def test_bonus_excludes_bare_number_reference_but_accepts_issue_closer(self):
        bare_score, bare_items = service._compute_bonus(
            'feat: GraphQL 수집기 구현',
            '이 PR은 #10이 먼저 머지되어야 합니다.',
        )
        closer_score, closer_items = service._compute_bonus(
            'feat: GraphQL 수집기 구현',
            '기존 수집 오류를 해결합니다. closes #10',
        )
        url_score, url_items = service._compute_bonus(
            'feat: GraphQL 수집기 구현',
            'https://github.com/SKKU-OSP/spring-backend/issues/10',
        )

        self.assertEqual(bare_score, 0.5)
        self.assertNotIn('이슈 연결', bare_items)
        self.assertEqual(closer_score, 1.5)
        self.assertIn('이슈 연결', closer_items)
        self.assertEqual(url_score, 1.5)
        self.assertIn('이슈 연결', url_items)

    def test_consistency_status_is_added_to_sentence_inputs(self):
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

        matched_good, matched_bad = service._build_sentence_inputs(
            fulfilment, clarity, [], [], consistency_status='matched',
            consistency_reason='실제 변경과 일치함',
        )
        partial_good, partial_bad = service._build_sentence_inputs(
            fulfilment, clarity, [], [], consistency_status='partially_matched',
            consistency_reason='일부 변경만 일치함',
        )
        na_good, na_bad = service._build_sentence_inputs(
            fulfilment, clarity, [], [], consistency_status='N/A'
        )

        self.assertTrue(any(item['label'] == '변경 정합성' for item in matched_good))
        self.assertEqual(
            next(item for item in matched_good if item['label'] == '변경 이유(Why)')['reason'],
            '변경 이유가 명확함',
        )
        self.assertEqual(
            next(item for item in matched_good if item['label'] == '변경 정합성')['reason'],
            '실제 변경과 일치함',
        )
        self.assertFalse(any(item['label'] == '변경 정합성' for item in matched_bad))
        self.assertTrue(any('변경 정합성' in item['label'] for item in partial_bad))
        self.assertFalse(any('변경 정합성' in item['label'] for item in partial_good))
        self.assertFalse(any('변경 정합성' in item['label'] for item in na_good + na_bad))

    @patch.object(llm_client, 'score_pr_consistency')
    @patch.object(llm_client, 'count_text_tokens', return_value=20)
    @patch.object(service.commit_service, '_fetch_commit_files', return_value=FILES)
    @patch.object(llm_client, 'choose_pr_consistency_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_fetches_selected_commits_then_finishes(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.side_effect = [
            decision('fetch_commit_diff', 'a' * 40),
            decision('fetch_commit_diff', 'b' * 40),
            decision('finish'),
        ]
        score.return_value = final_result('matched')

        result = service._run_pr_consistency_agent(
            'octocat', 'repo', 1, 'feat: login', '로그인을 추가합니다.'
        )

        self.assertEqual(result['score'], 2)
        self.assertEqual(result['examined_commits'], ['a' * 40, 'b' * 40])
        self.assertEqual(result['patch_tokens'], 40)
        self.assertEqual(result['stop_reason'], 'all_commits_examined')
        self.assertEqual(fetch.call_count, 2)
        self.assertEqual(choose.call_count, 2)
        self.assertTrue(result['run_id'])

    @patch.object(llm_client, 'score_pr_consistency')
    @patch.object(llm_client, 'count_text_tokens', return_value=20)
    @patch.object(service.commit_service, '_fetch_commit_files', return_value=FILES)
    @patch.object(llm_client, 'choose_pr_consistency_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS[:1])
    def test_single_commit_goes_directly_to_final_judgment(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.return_value = decision('fetch_commit_diff', 'a' * 40)
        score.return_value = final_result(summaries=[{
            'sha': 'a' * 40,
            'summary': '로그인 처리 코드를 변경했습니다.',
        }])

        result = service._run_pr_consistency_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertEqual(result['score'], 2)
        self.assertEqual(result['stop_reason'], 'all_commits_examined')
        self.assertEqual(
            result['commits'][0]['summary'], '로그인 처리 코드를 변경했습니다.'
        )
        self.assertEqual(result['commits'][0]['status'], 'success')
        choose.assert_called_once()
        fetch.assert_called_once()
        score.assert_called_once()

    @patch.object(llm_client, 'score_pr_consistency')
    @patch.object(llm_client, 'count_text_tokens', return_value=20)
    @patch.object(service.commit_service, '_fetch_commit_files', return_value=FILES)
    @patch.object(llm_client, 'choose_pr_consistency_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_duplicate_sha_is_returned_as_observation_and_not_fetched_twice(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.side_effect = [
            decision('fetch_commit_diff', 'a' * 40),
            decision('fetch_commit_diff', 'a' * 40),
            decision('finish'),
        ]
        score.return_value = final_result()

        service._run_pr_consistency_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        fetch.assert_called_once()
        final_observations = score.call_args.args[-1]
        self.assertTrue(any(item['status'] == 'duplicate' for item in final_observations))

    @patch.object(llm_client, 'score_pr_consistency')
    @patch.object(llm_client, 'count_text_tokens', return_value=20)
    @patch.object(service.commit_service, '_fetch_commit_files')
    @patch.object(llm_client, 'choose_pr_consistency_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_diff_failure_becomes_observation_and_loop_continues(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.side_effect = [
            decision('fetch_commit_diff', 'a' * 40),
            decision('fetch_commit_diff', 'b' * 40),
            decision('finish'),
        ]
        fetch.side_effect = [RuntimeError('temporary API error'), FILES]
        score.return_value = final_result('partially_matched')

        result = service._run_pr_consistency_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertEqual(result['score'], 1)
        self.assertEqual(result['attempted_commits'], ['a' * 40, 'b' * 40])
        observations = score.call_args.args[-1]
        self.assertEqual(observations[0]['status'], 'error')
        self.assertEqual(observations[1]['status'], 'success')

    @override_settings(PR_CONSISTENCY_MAX_ITERATIONS=3, PR_CONSISTENCY_MAX_TOKENS=1000)
    @patch.object(llm_client, 'score_pr_consistency')
    @patch.object(llm_client, 'count_text_tokens', side_effect=[1200, 400])
    @patch.object(service.commit_service, '_fetch_commit_files', return_value=FILES)
    @patch.object(llm_client, 'choose_pr_consistency_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_large_commit_is_skipped_then_smaller_commit_is_evaluated(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.side_effect = [
            decision('fetch_commit_diff', 'a' * 40),
            decision('fetch_commit_diff', 'b' * 40),
            decision('finish'),
        ]
        score.return_value = final_result()

        result = service._run_pr_consistency_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertEqual(result['score'], 2)
        self.assertEqual(result['examined_commits'], ['b' * 40])
        self.assertEqual(result['attempted_commits'], ['a' * 40, 'b' * 40])
        self.assertEqual(fetch.call_count, 2)
        observations = score.call_args.args[-1]
        self.assertEqual(observations[0]['status'], 'token_limit')
        self.assertEqual(observations[1]['status'], 'success')
        self.assertEqual(result['commits'][0]['status'], 'token_limit')
        self.assertEqual(result['commits'][1]['status'], 'success')

    @override_settings(PR_CONSISTENCY_MAX_ITERATIONS=2, PR_CONSISTENCY_MAX_TOKENS=1000)
    @patch.object(llm_client, 'score_pr_consistency')
    @patch.object(llm_client, 'count_text_tokens', return_value=1200)
    @patch.object(service.commit_service, '_fetch_commit_files', return_value=FILES)
    @patch.object(llm_client, 'choose_pr_consistency_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_all_commits_over_budget_returns_na(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.side_effect = [
            decision('fetch_commit_diff', 'a' * 40),
            decision('fetch_commit_diff', 'b' * 40),
        ]

        result = service._run_pr_consistency_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertIsNone(result['score'])
        self.assertEqual(result['status'], 'N/A')
        self.assertIn('모두 토큰 예산을 초과', result['reason'])
        self.assertEqual(fetch.call_count, 2)
        score.assert_not_called()

    @override_settings(PR_CONSISTENCY_MAX_ITERATIONS=3, PR_CONSISTENCY_MAX_TOKENS=1000)
    @patch.object(llm_client, 'score_pr_consistency')
    @patch.object(llm_client, 'count_text_tokens', return_value=600)
    @patch.object(service.commit_service, '_fetch_commit_files', return_value=FILES)
    @patch.object(llm_client, 'choose_pr_consistency_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS)
    def test_tiny_remaining_budget_finishes_with_examined_commits(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.return_value = decision('fetch_commit_diff', 'a' * 40)
        score.return_value = final_result()

        result = service._run_pr_consistency_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertEqual(result['score'], 2)
        self.assertEqual(result['stop_reason'], 'budget_exhausted')
        fetch.assert_called_once()
        choose.assert_called_once()
        score.assert_called_once()

    @override_settings(PR_CONSISTENCY_MAX_ITERATIONS=2)
    @patch.object(llm_client, 'score_pr_consistency')
    @patch.object(llm_client, 'count_text_tokens', return_value=5)
    @patch.object(service.commit_service, '_fetch_commit_files', return_value=FILES)
    @patch.object(llm_client, 'choose_pr_consistency_action')
    @patch.object(service, 'list_pr_commits', return_value=COMMITS + [{
        'sha': 'c' * 40,
        'message_headline': 'docs: login',
        'file_count': 1,
        'additions': 1,
        'deletions': 0,
    }])
    def test_max_iterations_forces_final_judgment(
        self, _list, choose, fetch, _tokens, score
    ):
        choose.side_effect = [
            decision('fetch_commit_diff', 'a' * 40),
            decision('fetch_commit_diff', 'b' * 40),
        ]
        score.return_value = final_result()

        result = service._run_pr_consistency_agent(
            'octocat', 'repo', 1, 'feat: login', 'body'
        )

        self.assertEqual(fetch.call_count, 2)
        self.assertEqual(result['stop_reason'], 'max_iterations')
        score.assert_called_once()
