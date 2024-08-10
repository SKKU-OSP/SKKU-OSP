from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Subquery, OuterRef
from django.contrib.auth.models import User

from rest_framework.response import Response
from rest_framework.views import APIView

from home.serializers import AnnualOverviewSerializer, AnnualTotalSerializer, DistScoreSerializer, DistFactorSerializer, RepositoryOwnerUpdateSerializer
from home.updateScore import user_score_update
from home.updateChart import update_chart
from home.models import AnnualOverview, AnnualTotal, DistFactor, DistScore, Repository, Student
from user.models import Account, GitHubScoreTable, StudentTab, GithubScore, GithubStatsYymm, GithubUserFollowing, GithubUserStarred, GithubOverview
from user.update_act import update_commmit_time, update_individual, update_frequency
from challenge.models import Challenge
from challenge.views import achievement_check
from repository.models import (GithubIssues, GithubPulls, GithubRepoCommits,
                               GithubRepoContributor, GithubRepoStats, GithubRepoCommitFiles, GithubRepoStatsyymm, GithubStars)
from handle_error import get_fail_res

import json
import time
import logging
from datetime import datetime


class StatisticView(APIView):
    start_year = 2019

    def get_validation(self, request):
        status = 'fail'
        error = None
        user = request.user

        try:
            if not user.is_superuser:
                error = "access_permission_denied"
            else:
                user = User.objects.get(id=user.id)
                status = 'success'
        except User.DoesNotExist:
            logging.exception(f'StatisticView user_not_found: {e}')
            error = "user_not_found"
        except Exception as e:
            logging.exception(f'StatisticView undefined_exception: {e}')
            error = "undefined_exception"

        return status, error

    def get(self, request):
        res = {'status': 'fail', 'message': '', 'data': None}

        try:
            start = time.time()
            data = {'annual_overview': None,
                    'annual_total': None, 'annual_data': None}

            status, error = self.get_validation(request)
            if status == 'fail':
                return Response(get_fail_res(error_code=error))

            annual_data = {}
            dept_set = GitHubScoreTable.objects.values(
                "dept").annotate(Count("dept"))

            dept_list = json.dumps(
                [dept["dept"] for dept in dept_set], ensure_ascii=False)

            # Factor의 연도별 평균 분포
            annual_overview = AnnualOverview.objects.order_by("case_num")
            data['annual_overview'] = AnnualOverviewSerializer(
                annual_overview, many=True).data
            end_year = self.start_year + \
                len(data['annual_overview'][0]['score']) - 1

            # Factor의 연도별 합산 분포
            annual_total = AnnualTotal.objects.order_by('case_num')
            data['annual_total'] = AnnualTotalSerializer(
                annual_total, many=True).data

            dist_score = DistScore.objects.order_by('case_num', 'year')
            dist_score_serializer = DistScoreSerializer(
                dist_score, many=True).data

            dist_factor = DistFactor.objects.order_by('case_num', 'year')
            dist_factor_serializer = DistFactorSerializer(
                dist_factor, many=True).data
            # 효율적인 접근을 위한 구조화
            structured_factor_data = [
                {'case_num': i, 'years': {}} for i in range(4)]
            # Score 관련 데이터 구조화
            factor = 'score'
            for obj in dist_score_serializer:
                case_num = obj["case_num"]
                year = obj["year"]
                if year not in structured_factor_data[case_num]["years"]:
                    structured_factor_data[case_num]["years"][year] = {}

                factor_obj = {}
                factor_obj["value"] = obj["score"]
                factor_obj["value_sid"] = obj["score_sid"]
                factor_obj["value_sid_std"] = obj["score_sid_std"]
                factor_obj["value_sid_pct"] = obj["score_sid_pct"]
                factor_obj["value_dept"] = obj["score_dept"]
                factor_obj["value_dept_std"] = obj["score_dept_std"]
                factor_obj["value_dept_pct"] = obj["score_dept_pct"]

                structured_factor_data[case_num]["years"][year][factor] = factor_obj
            # 기타 Factor 관련 데이터 구조화
            for obj in dist_factor_serializer:
                case_num = obj["case_num"]
                year = obj["year"]
                if year not in structured_factor_data[case_num]["years"]:
                    structured_factor_data[case_num]["years"][year] = {}

                factor = obj["factor"]
                factor_obj = {}
                factor_obj["value"] = obj["value"]
                factor_obj["value_sid"] = obj["value_sid"]
                factor_obj["value_sid_std"] = obj["value_sid_std"]
                factor_obj["value_sid_pct"] = obj["value_sid_pct"]
                factor_obj["value_dept"] = obj["value_dept"]
                factor_obj["value_dept_std"] = obj["value_dept_std"]
                factor_obj["value_dept_pct"] = obj["value_dept_pct"]

                structured_factor_data[case_num]["years"][year][factor] = factor_obj

            annual_data['factor'] = structured_factor_data

            data['annual_data'] = annual_data

            student_data = self.get_student_year(end_year)
            data['student_data'] = student_data

            data["years"] = [year for year in range(
                self.start_year, end_year+1)]

            # 학과 정보
            DEPTS = ['컴퓨터공학과', '소프트웨어학과', '글로벌융합학부']
            data["depts"] = DEPTS

            # 학번 정보
            # 성능상의 이슈로 하드코딩하여 sid 크기를 가져온다.
            sid_len = len(
                structured_factor_data[0]["years"][end_year]['score']['value_sid'])

            data["sids"] = list(range(end_year, end_year - sid_len, -1))
            data["factors"] = ["score", "commit", "star", "pr", "issue"]
            res['data'] = data
            res["status"] = 'success'
            print("소요시간", time.time() - start)
        except Exception as e:
            logging.exception(e)
            return Response(get_fail_res('undefined_exception'))

        return Response(res)

    def get_student_year(self, end_year):
        structured_data = {}

        for year in range(self.start_year, end_year+1):
            if year not in structured_data:
                structured_data[year] = []

        # Subquery를 사용하여 각 Student에 해당하는 Repository의 repo_num을 가져옵니다.
        stdnt_list = Student.objects.annotate(
            repo_num=Subquery(
                Repository.objects.filter(
                    year=OuterRef('year'),
                    owner=OuterRef('github_id')
                ).values('repo_num')[:1]
            )
        )
        for stdnt_data in stdnt_list:
            stdnt_json = stdnt_data.to_json()
            stdnt_json['repo'] = stdnt_data.repo_num
            structured_data[stdnt_data.year].append(stdnt_json)

        return structured_data


@login_required
def statistic(request):
    start_year = 2019
    if not request.user.is_superuser:
        return redirect(f'/user/{request.user.username}/')
    context = {}
    start = time.time()  # 시작 시간 저장
    dept_set = GitHubScoreTable.objects.values("dept").annotate(Count("dept"))
    context["dept_list"] = json.dumps(
        [dept["dept"] for dept in dept_set], ensure_ascii=False)

    annual_overview = AnnualOverview.objects.order_by("case_num")
    annual_overview_list = [overview.to_json() for overview in annual_overview]

    # 5. MODEL Student
    def getStudentYear(end_year):
        stdnt_case_list = [
            [[] for _ in range(start_year, end_year+1)] for _ in range(4)]
        stdnt_list = Student.objects.all()
        for stdnt_data in stdnt_list:
            stdnt_json = stdnt_data.to_json()
            yid = stdnt_data.year - start_year
            if stdnt_data.absence == 0 and stdnt_data.plural_major == 0:
                stdnt_case_list[0][yid].append(stdnt_json)
                stdnt_case_list[1][yid].append(stdnt_json)
                stdnt_case_list[2][yid].append(stdnt_json)
                stdnt_case_list[3][yid].append(stdnt_json)
            elif stdnt_data.absence == 0 and stdnt_data.plural_major == 1:
                stdnt_case_list[0][yid].append(stdnt_json)
                stdnt_case_list[2][yid].append(stdnt_json)
            elif stdnt_data.absence >= 1 and stdnt_data.plural_major == 0:
                stdnt_case_list[0][yid].append(stdnt_json)
                stdnt_case_list[1][yid].append(stdnt_json)
            elif stdnt_data.absence >= 1 and stdnt_data.plural_major == 1:
                stdnt_case_list[0][yid].append(stdnt_json)
        return stdnt_case_list

    annual_total_list = AnnualTotal.objects.order_by('case_num')
    annual_total = [[] for _ in range(4)]
    for annual_data in annual_total_list:
        annual_total[annual_data.case_num].append(annual_data.to_json())

    dist_score_total_list = DistScore.objects.order_by('case_num', 'year')
    dist_score_total = [[] for _ in range(4)]
    for dist_score in dist_score_total_list:
        dist_score_total[dist_score.case_num].append(dist_score.to_json())
    dist_factor_list = DistFactor.objects.order_by('case_num', 'year')
    dist_factor = [[] for _ in range(4)]
    for dist in dist_factor_list:
        dist_factor[dist.case_num].append(dist)
    for case in range(4):
        chartdata = {}

        # 1. MODEL AnnualOverview
        key_name = "annual_overview"
        chartdata[key_name] = json.dumps([annual_overview_list[case]])

        # 2. MODEL AnnualTotal
        chartdata["annual_total"] = json.dumps(annual_total[case])
        end_year = start_year + len(dist_score_total[case]) - 1
        if case == 0:
            stdnt_case_list = getStudentYear(end_year)
            repo_total_list = Repository.objects.all()
            repo_list = [[] for _ in range(end_year-start_year+1)]
            for repo in repo_total_list:
                if repo.year >= start_year:
                    repo_list[repo.year-start_year].append(repo.to_json())
            context["repo"] = json.dumps(repo_list)
            context["classNum"] = json.loads(annual_overview[case].class_num)
            context["levelStep"] = json.loads(annual_overview[case].level_step)

        for year in range(start_year, end_year+1):
            # 3. MODEL DistScore
            annual_dist = dist_score_total[case][year-start_year]
            # 4. MODEL DistFactor
            for row in dist_factor[case]:
                row_json = row.to_json()
                if row_json["year"] == year:
                    factor = row_json["factor"]
                    row_json[factor] = row_json.pop("value")
                    row_json[factor+"_sid"] = row_json.pop("value_sid")
                    row_json[factor+"_sid_std"] = row_json.pop("value_sid_std")
                    row_json[factor+"_sid_pct"] = row_json.pop("value_sid_pct")
                    row_json[factor+"_dept"] = row_json.pop("value_dept")
                    row_json[factor +
                             "_dept_std"] = row_json.pop("value_dept_std")
                    row_json[factor +
                             "_dept_pct"] = row_json.pop("value_dept_pct")
                    annual_dist.update(row_json)
            key_name = "year"+str(year)
            chartdata[key_name] = json.dumps([annual_dist])
        chartdata["student_year"] = json.dumps(stdnt_case_list[case])
        context["chartdata_"+str(case)] = json.dumps(chartdata)
    context["end_year"] = end_year
    context["year_list"] = [year for year in range(start_year, end_year+1)]
    context["year_list"].reverse()
    context['user_type'] = 'admin'
    print("time :", time.time() - start)  # 현재시각 - 시작시간 = 실행 시간
    # return JsonResponse(chartdata)
    return render(request, 'home/statistic.html', context)


@login_required
def update_score(request):
    if request.user.is_superuser:
        print('Update Start!')
        challenge_list = Challenge.objects.all()
        end_year = datetime.now().year
        start_year = 2019
        for user in Account.objects.filter(user__is_superuser=False):
            for chal in challenge_list:
                achievement_check(user, chal)
            for year in range(end_year, start_year-1, -1):
                user_score_update(user, year)
        update_commmit_time()
        update_individual()
        update_frequency()
        update_chart(63)
        print('Done!')

    return redirect(reverse('home:statistic'))

class GithubUpdateView(APIView):
    def post(self, request):
        old_owner = request.data.get('old_owner')
        new_owner = request.data.get('new_owner')

        try:
            repositories = Repository.objects.filter(owner=old_owner)
            students = Student.objects.filter(github_id=old_owner)
            student_tabs = StudentTab.objects.filter(github_id=old_owner)
            account = Account.objects.filter(github_id=old_owner)
            github_issues = GithubIssues.objects.filter(github_id=old_owner)
            github_overview = GithubOverview.objects.filter(github_id=old_owner)
            github_pulls = GithubPulls.objects.filter(github_id=old_owner)
            github_repo_commit_files = GithubRepoCommitFiles.objects.filter(github_id=old_owner)
            github_repo_commits = GithubRepoCommits.objects.filter(github_id=old_owner)
            github_repo_commits2 = GithubRepoCommits.objects.filter(author_github=old_owner)
            github_repo_contributors = GithubRepoContributor.objects.filter(github_id=old_owner)
            github_repo_contributors2 = GithubRepoContributor.objects.filter(owner_id=old_owner)
            github_repo_stats = GithubRepoStats.objects.filter(github_id=old_owner)
            github_repo_stats_yymm = GithubRepoStatsyymm.objects.filter(github_id=old_owner)
            github_scores = GithubScore.objects.filter(github_id=old_owner)
            github_stars = GithubStars.objects.filter(github_id=old_owner)
            github_stats_yymm = GithubStatsYymm.objects.filter(github_id=old_owner)
            github_user_followings = GithubUserFollowing.objects.filter(github_id=old_owner)
            github_user_followings2 = GithubUserFollowing.objects.filter(following_id=old_owner)
            github_user_starreds = GithubUserStarred.objects.filter(github_id=old_owner)
            github_user_scoretable = GitHubScoreTable.objects.filter(github_id=old_owner)

            repositories.update(owner=new_owner)
            students.update(github_id=new_owner)
            student_tabs.update(github_id=new_owner)
            account.update(github_id=new_owner)
            github_issues.update(github_id=new_owner)
            github_overview.update(github_id=new_owner)
            github_pulls.update(github_id=new_owner)
            github_repo_commit_files.update(github_id=new_owner)
            github_repo_commits.update(github_id=new_owner)
            github_repo_commits2.update(author_github=new_owner)
            github_repo_contributors.update(github_id=new_owner)
            github_repo_contributors2.update(owner_id=new_owner)
            github_repo_stats.update(github_id=new_owner)
            github_repo_stats_yymm.update(github_id=new_owner)
            github_stars.update(github_id=new_owner)
            github_stats_yymm.update(github_id=new_owner)
            github_user_starreds.update(github_id=new_owner)
            github_user_scoretable.update(github_id=new_owner)
            github_user_followings.update(github_id=new_owner)
            github_user_followings2.update(following_id=new_owner)


            for data in github_scores:
                yid = data.yid
                year = data.year
                new_yid = f"{year}{new_owner}"

                data.github_id = new_owner
                data.yid = new_yid
                data.save()


            return Response({"status": "success", "message": "github ID 수정 완료"})
        except Repository.DoesNotExist:
            return Response({"status": "fail", "message": "해당 유저 정보가 존재하지 않습니다."})
        except Exception as e:
            print(e)
            return Response({"status": "fail", "message": "github ID 수정 중 오류 발생"})