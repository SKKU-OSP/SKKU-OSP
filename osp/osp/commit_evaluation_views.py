import logging

import requests
from django.http import JsonResponse
from rest_framework.views import APIView

from . import commit_evaluation_service as svc

logger = logging.getLogger(__name__)


def _parse_repositories(repos_param: str) -> list[tuple[str, str]]:
    repositories = []
    seen = set()
    for item in repos_param.split(','):
        owner, separator, repo = item.strip().partition('/')
        pair = (owner, repo)
        if separator and owner and repo and pair not in seen:
            repositories.append(pair)
            seen.add(pair)
    return repositories


class CommitCountsView(APIView):
    def get(self, request):
        repositories = _parse_repositories(request.GET.get('repos', ''))
        try:
            counts = svc.get_commit_counts(repositories)
            return JsonResponse({'status': 'success', 'data': counts})
        except Exception as error:
            logger.error('커밋 카운트 조회 실패: %s', error)
            return JsonResponse(
                {'status': 'fail', 'message': '커밋 수를 불러오지 못했습니다.'},
                status=500,
            )


class CommitListView(APIView):
    def get(self, request):
        github_username = request.GET.get('githubUsername')
        repo_name = request.GET.get('repoName')
        if not github_username or not repo_name:
            return JsonResponse(
                {'status': 'fail', 'message': 'githubUsername, repoName은 필수입니다.'},
                status=400,
            )

        try:
            commits = svc.get_commit_list(github_username, repo_name)
            return JsonResponse({'status': 'success', 'data': commits})
        except Exception as error:
            logger.error('커밋 목록 조회 실패: %s/%s - %s', github_username, repo_name, error)
            return JsonResponse(
                {'status': 'fail', 'message': '커밋 목록을 불러오지 못했습니다.'},
                status=500,
            )


class CommitEvaluationView(APIView):
    def get(self, request):
        github_username = request.GET.get('githubUsername')
        repo_name = request.GET.get('repoName')
        sha = request.GET.get('sha')
        if not github_username or not repo_name or not sha:
            return JsonResponse(
                {'status': 'fail', 'message': 'githubUsername, repoName, sha는 필수입니다.'},
                status=400,
            )
        try:
            result = svc.get_evaluation(github_username, repo_name, sha)
            return JsonResponse({'status': 'success', 'data': result})
        except ValueError as error:
            return JsonResponse({'status': 'fail', 'message': str(error)}, status=400)
        except Exception as error:
            logger.error('커밋 평가 조회 실패: %s/%s@%s - %s', github_username, repo_name, sha, error)
            return JsonResponse(
                {'status': 'fail', 'message': '커밋 평가를 불러오지 못했습니다.'},
                status=500,
            )

    def post(self, request):
        github_username = request.data.get('githubUsername')
        repo_name = request.data.get('repoName')
        sha = request.data.get('sha')
        if not github_username or not repo_name or not sha:
            return JsonResponse(
                {'status': 'fail', 'message': 'githubUsername, repoName, sha는 필수입니다.'},
                status=400,
            )
        try:
            result = svc.evaluate(github_username, repo_name, sha)
            return JsonResponse({'status': 'success', 'data': result})
        except ValueError as error:
            return JsonResponse({'status': 'fail', 'message': str(error)}, status=400)
        except Exception as error:
            logger.error('커밋 평가 실패: %s/%s@%s - %s', github_username, repo_name, sha, error)
            message = str(error)
            if '429' in message or 'RESOURCE_EXHAUSTED' in message:
                user_message = 'AI 사용량 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
            elif '503' in message or '529' in message or 'UNAVAILABLE' in message:
                user_message = 'AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해 주세요.'
            elif 'timed out' in message:
                user_message = 'AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
            elif isinstance(error, requests.RequestException):
                user_message = '커밋 변경 파일을 불러오지 못했습니다. Spring 서버를 확인해 주세요.'
            else:
                user_message = 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
            return JsonResponse({'status': 'fail', 'message': user_message}, status=500)


class CommitFileSummariesView(APIView):
    def post(self, request):
        github_username = request.data.get('githubUsername')
        repo_name = request.data.get('repoName')
        sha = request.data.get('sha')
        if not github_username or not repo_name or not sha:
            return JsonResponse(
                {'status': 'fail', 'message': 'githubUsername, repoName, sha는 필수입니다.'},
                status=400,
            )
        try:
            result = svc.get_or_create_file_summaries(
                github_username, repo_name, sha
            )
            return JsonResponse({'status': 'success', 'data': result})
        except ValueError as error:
            return JsonResponse({'status': 'fail', 'message': str(error)}, status=400)
        except Exception as error:
            logger.error(
                '커밋 파일 요약 실패: %s/%s@%s - %s',
                github_username, repo_name, sha, error,
            )
            message = str(error)
            if '429' in message or 'RESOURCE_EXHAUSTED' in message:
                user_message = 'AI 사용량 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
            elif isinstance(error, requests.RequestException):
                user_message = '커밋 변경 파일을 불러오지 못했습니다. Spring 서버를 확인해 주세요.'
            else:
                user_message = '파일 변경 요약을 불러오지 못했습니다.'
            return JsonResponse({'status': 'fail', 'message': user_message}, status=500)
