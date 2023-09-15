from django.contrib.auth.models import User
from django.db.models import Avg, Sum, Subquery

from rest_framework.response import Response
from rest_framework.views import APIView

from repository.models import GithubRepoStats
from user.serializers_dashboard import GithubScoreResultSerializer
from user.models import StudentTab, GithubScore, Account, GithubStatsYymm, AccountPrivacy
from handle_error import get_fail_res

import time
import logging


def get_user_star(github_id: str):
    # 서브쿼리를 이용해 모든 유저의 Star 개수를 계산
    star_subquery = Subquery(StudentTab.objects.values('github_id'))
    # repo_name, owner_id, github_id 값 비교
    where_stmt = [
        "github_repo_contributor.repo_name=github_repo_stats.repo_name",
        "github_repo_contributor.owner_id=github_repo_stats.github_id",
        "github_repo_contributor.github_id=github_repo_stats.github_id"]
    star_data = GithubRepoStats.objects.filter(github_id__in=star_subquery).extra(
        tables=['github_repo_contributor'], where=where_stmt).values('github_id').annotate(star=Sum("stargazers_count"))
    total_stars = sum(item['star'] for item in star_data)
    avg_stars = total_stars / max(len(star_data), 1)

    # 순회해서 찾고 반환
    user_star = {"star": 0, "avg": avg_stars}
    for row in star_data:
        if row["github_id"] == github_id:
            user_star["star"] = row["star"]
            break

    return user_star


class UserDashboardView(APIView):
    '''
    유저 대시보드
    url     : /user/<username>
    '''

    def get(self, request, username):

        start = time.time()
        data = {}

        # 익명 체크
        if request.user.is_anonymous:
            return Response(get_fail_res("require_login"))

        # 해당 유저의 대시보드 접근 권한 체크
        try:
            target_user = User.objects.get(username=username)
            if target_user.is_superuser:
                return Response(get_fail_res("access_denied"))
            target_account = Account.objects.get(user=target_user)
            acc_pp = AccountPrivacy.objects.get(account=target_account)
            print("acc_pp", acc_pp.open_lvl, acc_pp.is_write, acc_pp.is_open)

            # 권한 체크
            print("request.user.username", request.user.username)
            print("username", username)

            is_own = request.user.username.lower() == username.lower()
            is_superuser = request.user.is_superuser
            is_open = acc_pp.open_lvl == 2
            # 팀원여부 확인 (잠정 보류)
            # target_team = TeamMember.objects.filter(
            #     member=target_account).values('team')
            # coworkers = TeamMember.objects.filter(
            #     member=request.user.account, team__in=target_team)
            # is_member = coworkers.exists()
            permission = is_own or is_superuser or is_open
            if not permission:
                return Response(get_fail_res("access_permission_denied"))
        except Exception as e:
            logging.exception(f"UserDashboardView Exception: {e}")
        # 최신 점수 가져옴
        github_id = target_account.github_id
        score = GithubScore.objects.filter(
            github_id=github_id).order_by("-year")
        years = score.values_list("year", flat=True)
        num_year = len(years)
        start_year, end_year = min(years), max(years)
        data['year'] = years
        github_score_result = GithubScoreResultSerializer(
            score, many=True).data
        data['score'] = github_score_result

        # star 데이터 따로 처리
        user_star = get_user_star(github_id=github_id)

        # 연도별 월기여내역 데이터
        monthly_contr = {year: [] for year in years}
        # 기간별 수집된 데이터를 이용해 월 기여내역 데이터 쿼리
        gitstat_year = GithubStatsYymm.objects.filter(
            github_id=github_id, start_yymm__year__gte=start_year, start_yymm__year__lte=end_year)
        for row in gitstat_year:
            row_json = row.to_json()
            row_json['star'] = user_star["star"]
            monthly_contr[row_json["year"]].append(row_json)
        data['monthly_contr'] = monthly_contr

        # TODO factor 별 히스토그램

        # TODO 유저의 factor 기여내역

        # TODO 전체 유저의 factor 기여내역 평균

        print("UserDashboardView:", time.time() - start)
        return Response({"status": "success", "data": data})
