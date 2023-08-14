from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.http import JsonResponse


from rest_framework.response import Response
from rest_framework.views import APIView

from home.models import AnnualOverview, AnnualTotal, DistFactor, DistScore, Repository, Student
from user.models import GitHubScoreTable
from user.models import Account
from challenge.models import Challenge
from home.serializers import AnnualOverviewSerializer, AnnualTotalSerializer, DistScoreSerializer, DistFactorSerializer

from home.updateScore import user_score_update
from home.updateChart import update_chart
from challenge.views import achievement_check
from user.update_act import update_commmit_time, update_individual, update_frequency

import json
import time
from datetime import datetime


class StatisticView(APIView):
    start_year = 2019

    def get(self, request):
        res = {'status': 'fail', 'message': '', 'data': None}

        try:
            start = time.time()
            data = {'annual_overview': None,
                    'annual_total': None, 'annual_data': None}
            annual_data = {}
            dept_set = GitHubScoreTable.objects.values(
                "dept").annotate(Count("dept"))
            print("dept_set", type(dept_set), dept_set)

            dept_list = json.dumps(
                [dept["dept"] for dept in dept_set], ensure_ascii=False)
            print("dept_list", type(dept_list), dept_list)

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
            res['data'] = data
            res["status"] = 'success'
            print("소요시간", time.time() - start)
        except Exception as e:
            return Response(res)

        return Response(res)

    def get_student_year(self, end_year):
        structured_data = {}

        for year in range(self.start_year, end_year+1):
            if year not in structured_data:
                structured_data[year] = []

        stdnt_list = Student.objects.all()
        for stdnt_data in stdnt_list:
            stdnt_json = stdnt_data.to_json()
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
    return JsonResponse(chartdata)
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
