import logging

from django.http import JsonResponse
from rest_framework.views import APIView

from . import readme_evaluation_service as svc
from .ai_evaluation_usage import (
    enforce_daily_limit,
    EvaluationLimitExceeded,
    evaluation_status,
    get_request_github_id,
    RequireAuthenticatedEvaluationPostMixin,
    track_evaluation,
)

logger = logging.getLogger(__name__)


class AiEvaluationProxyView(RequireAuthenticatedEvaluationPostMixin, APIView):

    def get(self, request):
        github_username = request.GET.get('githubUsername')
        repo_name = request.GET.get('repoName')

        if not github_username or not repo_name:
            return JsonResponse(
                {'status': 'fail', 'message': 'githubUsername, repoName은 필수입니다.'},
                status=400,
            )

        result = svc.get_evaluation(github_username, repo_name)
        return JsonResponse({'status': 'success', 'data': result})

    def post(self, request):
        github_username = request.data.get('githubUsername')
        repo_name = request.data.get('repoName')

        if not github_username or not repo_name:
            return JsonResponse(
                {'status': 'fail', 'message': 'githubUsername, repoName은 필수입니다.'},
                status=400,
            )

        try:
            actor_github_id = get_request_github_id(request)
            enforce_daily_limit(actor_github_id, 'readme')
            with track_evaluation(
                actor_github_id,
                'readme',
                {'owner': github_username, 'repo': repo_name},
            ) as usage:
                result = svc.evaluate(github_username, repo_name)
                usage.complete(evaluation_status(result, 'readme'))
            return JsonResponse({'status': 'success', 'data': result})
        except EvaluationLimitExceeded as e:
            return JsonResponse({
                'status': 'fail',
                'code': 'AI_EVALUATION_LIMIT_EXCEEDED',
                'reason': e.reason,
                'message': str(e),
                'usage': e.usage_state,
            }, status=429)
        except ValueError as e:
            return JsonResponse({'status': 'fail', 'message': str(e)}, status=400)
        except Exception as e:
            logger.error("README 평가 실패: %s/%s - %s", github_username, repo_name, e)
            msg = str(e) if e.args else ''
            if '429' in msg or 'RESOURCE_EXHAUSTED' in msg:
                user_msg = 'AI 사용량 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
            elif '503' in msg or 'UNAVAILABLE' in msg or 'high demand' in msg:
                user_msg = 'AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해 주세요.'
            elif 'timed out' in msg or 'Read timed out' in msg:
                user_msg = 'AI 응답 시간이 초과되었습니다. README가 너무 길거나 서버가 혼잡할 수 있습니다.'
            else:
                user_msg = 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
            return JsonResponse({'status': 'fail', 'message': user_msg}, status=500)
