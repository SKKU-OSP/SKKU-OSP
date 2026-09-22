from django.test import SimpleTestCase

from osp import readme_evaluation_service as service
from repository.models import GithubRepoAiEvaluation


class ReadmeEvaluationResponseTest(SimpleTestCase):
    def _entity(self, status: str) -> GithubRepoAiEvaluation:
        return GithubRepoAiEvaluation(
            github_id='octocat',
            repo_name='repo',
            readme_evaluation_status=status,
            model_name='claude-test',
            readme_score='A',
            readme_total_score=10,
            readme_criteria_scores={'clarity': {'score': 4}},
            readme_missing_essentials=['실행 방법'],
            readme_strengths=['기존 잘한 점'],
            readme_improvements=['기존 보완점'],
            readme_advice=['기존 조언'],
        )

    def test_code_only_response_hides_stale_llm_result(self):
        result = service._entity_to_dict(self._entity('code_only'), '# README')

        self.assertEqual(result['evaluation_status'], 'code_only')
        self.assertIsNone(result['score'])
        self.assertIsNone(result['criteria_scores'])
        self.assertIsNone(result['strengths'])

    def test_partial_response_keeps_score_but_hides_stale_sentences(self):
        result = service._entity_to_dict(self._entity('partial'), '# README')

        self.assertEqual(result['score'], 'A')
        self.assertEqual(result['criteria_scores'], {'clarity': {'score': 4}})
        self.assertIsNone(result['strengths'])
        self.assertIsNone(result['improvements'])
        self.assertIsNone(result['advice'])

    def test_full_response_includes_score_and_sentences(self):
        result = service._entity_to_dict(self._entity('full'), '# README')

        self.assertEqual(result['score'], 'A')
        self.assertEqual(result['strengths'], ['기존 잘한 점'])
        self.assertEqual(result['improvements'], ['기존 보완점'])
        self.assertEqual(result['advice'], ['기존 조언'])
