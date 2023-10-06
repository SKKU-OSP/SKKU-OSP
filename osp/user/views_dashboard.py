import logging
import time

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError
from django.db.models import Subquery, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from handle_error import get_fail_res, get_missing_data_msg
from home.models import AnnualOverview, DistFactor, DistScore, Student
from home.serializers import (AnnualOverviewDashboardSerializer,
                              DistFactorDashboardSerializer,
                              DistScoreDashboardSerializer)
from repository.models import GithubRepoStats
from user import update_act
from user.gbti import get_type_analysis, get_type_test
from user.models import (Account, AccountPrivacy, DevType, GithubScore,
                         GithubStatsYymm, StudentTab)
from user.serializers_dashboard import GithubScoreResultSerializer


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
    url     : /user/api/dashboard/<username>/
    '''

    def get(self, request, username):

        start = time.time()
        data = {}

        target_account, error = get_account_valid(request, username)
        if error:
            return Response(get_fail_res(error_code=error))
        github_id = target_account.github_id

        # 최신 점수 가져옴
        github_id = target_account.github_id
        score = GithubScore.objects.filter(
            github_id=github_id).order_by("-year")
        # 연도 계산
        years = score.values_list("year", flat=True)
        start_year, end_year = min(years), max(years)
        data['years'] = years

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
            row_json['total'] = 0
            for key in ['star', 'repo_cr', 'repo_co', 'commit', 'pr', 'issue']:
                row_json['total'] += row_json[key]
            monthly_contr[row_json["year"]].append(row_json)
        data['monthly_contr'] = monthly_contr

        # 기여내역 factor 별 히스토그램을 위한 분포 데이터 처리
        dist_score = DistScore.objects.filter(
            case_num=0).order_by('case_num', 'year')
        dist_score_data = DistScoreDashboardSerializer(
            dist_score, many=True).data
        dist_factor = DistFactor.objects.filter(case_num=0).order_by('year')
        dist_factor_data = DistFactorDashboardSerializer(
            dist_factor, many=True).data

        factor_dist = get_nested_dict(years)
        # 연도별 score 데이터 할당
        for obj in dist_score_data:
            year = obj["year"]
            factor_dist[year]["score"] = obj["score"]
        # 연도별 각 factor 데이터 할당
        for obj in dist_factor_data:
            year = obj["year"]
            factor = obj["factor"]
            factor_dist[year][factor] = obj["value"]

        data['factor_dist'] = factor_dist
        data["factors"] = ["score", "commit", "star", "pr", "issue"]

        # 유저의 factor 기여내역
        annual_user_factor = get_nested_dict(years)
        students = Student.objects.filter(github_id=github_id)
        for student in students:
            # year, score, commit, star, pr, issue 값 가져옴
            user_factors = student.get_factors()
            annual_user_factor[user_factors['year']] = user_factors
        data['annual_user_factor'] = annual_user_factor

        # 전체 유저의 factor 기여내역 평균
        annual_overview = AnnualOverview.objects.get(case_num=0)
        annual_overview_data = AnnualOverviewDashboardSerializer(
            annual_overview).data

        # 히스토그램 세팅값(bar 개수, 구간 사이즈)
        dist_setting = {}
        class_nums = annual_overview_data['class_num']
        level_steps = annual_overview_data['level_step']
        for vals in zip(data["factors"], class_nums,  level_steps):
            factor, class_size, step_size = vals
            dist_setting[factor] = {}
            dist_setting[factor]['class_num'] = class_size
            dist_setting[factor]['level_step'] = step_size
        data['dist_setting'] = dist_setting

        # 연도별 유저의 기여 factor 평균값
        annual_factor_avg = get_nested_dict(years)
        for factor in data["factors"]:
            for idx, val in enumerate(annual_overview_data[factor]):
                annual_factor_avg[idx+start_year][factor] = val
        data['annual_factor_avg'] = annual_factor_avg

        # 개발자 유형, 성향 데이터
        devtype = get_dev_type(target_account, github_id)
        devtendency = get_dev_tendency(target_account, github_id)
        data.update(devtype)
        data.update(devtendency)

        print("UserDashboardView:", time.time() - start)
        return Response({"status": "success", "data": data})


class UserDevTendencyView(APIView):
    '''
    유저 개발자 성향분석 조회
    url     : /user/api/dashboard/<username>/dev-tendency/
    '''

    def get(self, request, username):
        target_account, error = get_account_valid(request, username)
        if error:
            return Response(get_fail_res(error_code=error))
        github_id = target_account.github_id
        data = get_dev_tendency(target_account, github_id)
        return Response({'status': 'success', 'data': data})


class UserDevTypeView(APIView):
    '''
    유저 개발자 유형 조회
    url     : /user/api/dashboard/<username>/dev-type/
    '''

    def get(self, request, username):

        target_account, error = get_account_valid(request, username)
        if error:
            return Response(get_fail_res(error_code=error))
        github_id = target_account.github_id

        # 개발자 유형, 성향 데이터
        data = get_dev_type(target_account, github_id)

        return Response({"status": "success", "data": data})


def get_account_valid(request, username):
    # 익명 체크
    if request.user.is_anonymous:
        return None, "require_login"

    # 해당 유저의 대시보드 접근 권한 체크
    try:
        target_user = User.objects.get(username=username)
        if target_user.is_superuser:
            return None, "access_denied"
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
            return None, "access_permission_denied"
    except Exception as e:
        logging.exception(f"UserDashboardView Exception: {e}")
        return None, 'undefined_exception'

    return target_account, None


def get_dev_tendency(account, github_id):
    data = {'dev_tendency': None, 'dev_tendency_data': None}

    # GitHub 활동 분석 내용 읽기
    commit_time = update_act.read_commit_time(github_id)
    hour_dist, time_circmean, daytime, night, daytime_min, daytime_max = commit_time
    major_act, indi_num, group_num = update_act.read_major_act(github_id)
    commit_freq, commit_freq_dist = update_act.read_frequency(github_id)

    # 분석 내용 업데이트
    typeE = -1 if daytime > night else 1
    typeF = commit_freq
    typeG = 1 if major_act == 'individual' else -1
    devtype, created = DevType.objects.get_or_create(account=account)
    if created:
        # 만약 개발자 유형이 없는 경우 생성 후 디폴트 값 추가
        devtype.typeA = 0
        devtype.typeB = 0
        devtype.typeC = 0
        devtype.typeD = 0
    devtype.typeE = typeE
    devtype.typeF = typeF
    devtype.typeG = typeG
    devtype.save()

    dev_tendency = {'typeE': typeE, 'typeF': typeF,
                    'typeG': typeG, "details": []}
    # 개발자 성향 문구 표시를 위한 데이터 가져오기
    tndcy_desc, tndcy_descKR, tndcy_icon = get_type_analysis(
        list(dev_tendency.values()))
    for desc, descKR, icon in list(zip(tndcy_desc, tndcy_descKR, tndcy_icon)):
        dev_tendency['details'].append(
            {'desc': desc, 'descKR': descKR, 'icon': icon})
    data["dev_tendency"] = dev_tendency

    try:
        # 개발자 성향 차트를 그리기 위한 데이터 추가
        dev_tendency_data = {}
        dev_tendency_data["typeE_data"] = hour_dist
        dev_tendency_data["typeE_sector"] = [
            int(daytime_min/3600), int(daytime_max/3600)]
        dev_tendency_data["typeF_data"] = commit_freq_dist
        dev_tendency_data["typeG_data"] = [indi_num, group_num]
        print("dev_tendency_data", dev_tendency_data)
        data["dev_tendency_data"] = dev_tendency_data
    except Exception as e:
        logging.exception(f"Get Type data error: {e}")

    return data


def get_dev_type(account, github_id):
    data = {'gbti': None}
    try:
        devtype = DevType.objects.get(account=account)
    except ObjectDoesNotExist as e:
        logging.error(f"{github_id} DevType No Data: {e}")
        return data

    # 개발자 유형
    dev_type = {"typeA": devtype.typeA, "typeB": devtype.typeB,
                "typeC": devtype.typeC, "typeD": devtype.typeD}
    if not all(val == 0 for val in dev_type.values()):
        # 모든 값이 0인 경우 개발자 유형 검사를 진행하지 않은 것으로 간주
        dev_type.update(get_type_test(
            devtype.typeA, devtype.typeB, devtype.typeC, devtype.typeD))

        def get_type_len(type_val):
            return (int((100 - type_val)/2) - 3, int((100 + type_val)/2) + (100 + type_val) % 2 - 3)
        # 개발자 ID 카드 렌더링을 위한 길이 데이터
        dev_type["typeAl"], dev_type["typeAr"] = get_type_len(
            dev_type["typeA"])
        dev_type["typeBl"], dev_type["typeBr"] = get_type_len(
            dev_type["typeB"])
        dev_type["typeCl"], dev_type["typeCr"] = get_type_len(
            dev_type["typeC"])
        dev_type["typeDl"], dev_type["typeDr"] = get_type_len(
            dev_type["typeD"])
        data['gbti'] = dev_type

    return data


def get_nested_dict(keys):
    '''
    딕셔너리를 중첩하여 할당하여 반환하는 함수 
    '''
    ret = {}
    for key in keys:
        ret[key] = {}
    return ret


class DevTypeTestSaveView(APIView):

    def post(self, request, username):
        '''
        유저 개발자 유형 결과 저장
        url     : /user/api/dashboard/<username>/dev-type/save/
        '''
        dev_type = request.data.get('type')
        if dev_type is None:
            appended_msg = get_missing_data_msg('type')
            return Response(get_fail_res('missing_required_data', appended_msg))
        type_factors = request.data.get('factor')
        if type_factors is None:
            appended_msg = get_missing_data_msg('factor')
            return Response(get_fail_res('missing_required_data', appended_msg))
        try:
            account = Account.objects.get(user__username=username)
        except ObjectDoesNotExist:
            logging.error("account DoesNotExist", e)
            return Response(get_fail_res('user_not_found'))
        if request.user.username != username:
            return Response(get_fail_res('access_permission_denied'))

        try:
            devtype_objs = DevType.objects.filter(account=account)
            if len(devtype_objs) == 0:
                devtype = DevType(
                    account=account,
                    typeA=type_factors[0],
                    typeB=type_factors[1],
                    typeC=type_factors[2],
                    typeD=type_factors[3],
                    typeE=0, typeF=0, typeG=0
                )
                devtype.save()
            else:
                devtype = devtype_objs.first()
                devtype.typeA = type_factors[0]
                devtype.typeB = type_factors[1]
                devtype.typeC = type_factors[2]
                devtype.typeD = type_factors[3]
                devtype.save()
        except DatabaseError as e:
            logging.error(f"DevTypeTestSaveView DatabaseError: {e}")
            return Response(get_fail_res('db_exception'))
        except Exception as e:
            logging.exception(f"DevTypeTestSaveView Exception: {e}")
            return Response(get_fail_res('undefined_exception'))

        return Response({'status': 'success', 'message': '저장했습니다.'})
