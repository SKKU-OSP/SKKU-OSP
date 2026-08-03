import logging

from django.db import connection
from django.http import JsonResponse
from rest_framework.views import APIView

from . import pr_evaluation_service as svc

logger = logging.getLogger(__name__)


class PrCountsView(APIView):
    def get(self, request):
        # repos 파라미터: "owner1/repo1,owner2/repo2,..." 형태
        repos_param = request.GET.get('repos', '')
        if not repos_param:
            return JsonResponse({'status': 'success', 'data': {}})

        pairs = []
        for item in repos_param.split(','):
            item = item.strip()
            if '/' in item:
                owner, _, repo = item.partition('/')
                if owner and repo:
                    pairs.append((owner, repo))

        if not pairs:
            return JsonResponse({'status': 'success', 'data': {}})

        conditions = ' OR '.join(['(owner_id = %s AND repo_name = %s)'] * len(pairs))
        params = [val for pair in pairs for val in pair]
        sql = (
            f"SELECT repo_name, COUNT(number) FROM v_github_pulls "
            f"WHERE {conditions} GROUP BY repo_name"
        )
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            rows = cursor.fetchall()
        result = {repo_name: count for repo_name, count in rows}
        return JsonResponse({'status': 'success', 'data': result})


class PrListView(APIView):
    def get(self, request):
        github_username = request.GET.get('githubUsername')
        repo_name = request.GET.get('repoName')
        if not github_username or not repo_name:
            return JsonResponse({'status': 'fail', 'message': 'githubUsername, repoName은 필수입니다.'}, status=400)
        pulls = svc.get_pr_list(github_username, repo_name)
        return JsonResponse({'status': 'success', 'data': pulls})


class PrEvaluationView(APIView):

    def get(self, request):
        github_username = request.GET.get('githubUsername')
        repo_name = request.GET.get('repoName')
        pr_number = request.GET.get('prNumber')
        if not github_username or not repo_name or not pr_number:
            return JsonResponse(
                {'status': 'fail', 'message': 'githubUsername, repoName, prNumber은 필수입니다.'},
                status=400,
            )
        result = svc.get_evaluation(github_username, repo_name, int(pr_number))
        return JsonResponse({'status': 'success', 'data': result})

    def post(self, request):
        github_username = request.data.get('githubUsername')
        repo_name = request.data.get('repoName')
        pr_number = request.data.get('prNumber')
        if not github_username or not repo_name or pr_number is None:
            return JsonResponse(
                {'status': 'fail', 'message': 'githubUsername, repoName, prNumber은 필수입니다.'},
                status=400,
            )
        try:
            result = svc.evaluate(github_username, repo_name, int(pr_number))
            return JsonResponse({'status': 'success', 'data': result})
        except ValueError as e:
            return JsonResponse({'status': 'fail', 'message': str(e)}, status=400)
        except Exception as e:
            logger.error("PR 평가 실패: %s/%s#%s - %s", github_username, repo_name, pr_number, e)
            msg = str(e) if e.args else ''
            if '429' in msg or 'RESOURCE_EXHAUSTED' in msg:
                user_msg = 'AI 사용량 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
            elif '503' in msg or 'UNAVAILABLE' in msg:
                user_msg = 'AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해 주세요.'
            elif 'timed out' in msg:
                user_msg = 'AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
            else:
                user_msg = 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
            return JsonResponse({'status': 'fail', 'message': user_msg}, status=500)