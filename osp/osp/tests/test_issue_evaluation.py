from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from osp import issue_evaluation_service as service
from osp import llm_client
from repository.models import GithubIssueAiEvaluation


class IssueSkipReasonTest(SimpleTestCase):
    def test_saved_skip_reason_is_returned_to_user(self):
        entity = GithubIssueAiEvaluation(
            github_id='octocat', repo_name='repo', issue_number=1,
            issue_type='skip',
            issue_breakdown={
                'skip_reason': '사용 방법을 묻는 질문 이슈이므로 평가에서 제외했습니다.'
            },
        )

        result = service._entity_to_dict(entity, '사용 방법이 궁금합니다.')

        self.assertEqual(result['issue_type'], 'skip')
        self.assertEqual(
            result['skip_reason'],
            '사용 방법을 묻는 질문 이슈이므로 평가에서 제외했습니다.',
        )
        self.assertEqual(
            result['skip_message'],
            '버그 증상이나 원하는 기능을 구체적으로 작성한 뒤 다시 평가해 주세요.',
        )

    def test_legacy_skip_without_reason_uses_friendly_fallback(self):
        entity = GithubIssueAiEvaluation(
            github_id='octocat', repo_name='repo', issue_number=1,
            issue_type='skip', issue_breakdown=None,
        )

        result = service._entity_to_dict(entity)

        self.assertEqual(result['skip_reason'], service._SKIP_REASON_FALLBACK)

    @patch.object(service.GithubIssueAiEvaluation.objects, 'get_or_create')
    @patch.object(service.llm_client, 'score_issue')
    @patch.object(service, '_get_issue_body', return_value='사용 방법이 궁금합니다.')
    @patch.object(service.GithubIssues.objects, 'filter')
    def test_evaluate_persists_llm_skip_reason(
        self, issue_filter, _body, score_issue, get_or_create
    ):
        issue_filter.return_value.first.return_value = SimpleNamespace(
            title='질문: 어떻게 사용하나요?'
        )
        score = llm_client.IssueScoreResponse(
            issue_type='skip',
            issue_type_reason='사용 방법을 묻는 질문이며 버그나 기능 제안이 아닙니다.',
        )
        score._actual_model = 'claude-test'
        score._actual_cost = 0.001
        score_issue.return_value = score
        entity = MagicMock()
        entity.issue_number = 1
        entity.updated_at = None
        get_or_create.return_value = (entity, True)

        result = service.evaluate('octocat', 'repo', 1)

        self.assertEqual(entity.issue_breakdown, {
            'skip_reason': '사용 방법을 묻는 질문이며 버그나 기능 제안이 아닙니다.'
        })
        entity.save.assert_called_once()
        self.assertEqual(result['skip_reason'], entity.issue_breakdown['skip_reason'])
