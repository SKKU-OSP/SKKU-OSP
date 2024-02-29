import datetime
import json
import logging
import math
import time
import os

from django.contrib.auth.models import User
from django.db import DatabaseError, transaction
from django.db.models import Q, Avg, Subquery, Sum

from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from django.core.files.images import get_image_dimensions
from django.core.exceptions import ObjectDoesNotExist

from django.shortcuts import redirect

from rest_framework.response import Response
from rest_framework.views import APIView

from home.models import AnnualOverview, DistFactor, DistScore, Student
from repository.models import (GithubIssues, GithubPulls, GithubRepoCommits,
                               GithubRepoContributor, GithubRepoStats)
from user import update_act
from team.models import TeamMember
from user.models import (Account, AccountInterest, AccountPrivacy, DevType,
                         GithubScore, GitHubScoreTable, GithubStatsYymm,
                         StudentTab)

from tag.models import DomainLayer, TagIndependent

from user.serializers import (AccountDetailSerializer,
                              AccountInterestSerializer, AccountSerializer,
                              StudentSerializer)
from home.serializers import (AnnualOverviewDashboardSerializer,
                              DistFactorDashboardSerializer,
                              DistScoreDashboardSerializer)
from user.serializers import AccountSerializer

from user import update_act
from user.gbti import get_type_analysis, get_type_test

from user.forms import ProfileImgUploadForm


from handle_error import get_fail_res, get_missing_data_msg


from user.gbti import get_type_analysis, get_type_test
from user.models import (Account, AccountPrivacy, DevType, GithubScore,
                         GitHubScoreTable, GithubStatsYymm, StudentTab)

from user.serializers import GithubScoreResultSerializer


class UserAccountView(APIView):

    def get_validation(self, request, status, errors):
        user = request.user

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        return status, errors

    def get(self, request):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors \
            = self.get_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        try:
            account = Account.objects.get(user=request.user)
            data['account'] = AccountSerializer(account).data

            if not request.user.is_superuser:
                name = StudentTab.objects.get(id=account.student_data_id).name
                data['name'] = name

        except DatabaseError as e:
            # Database Exception handling
            status = 'fail'
            errors['DB_exception'] = 'DB Error'
            logging.error(e)
        except Exception as e:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'
            logging.exception(e)

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}
        return Response(res)


class GuidelineView(APIView):

    def get_validation(self, request, status, errors, username):
        user = request.user

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                errors["user_not_found"] = "해당 유저가 존재하지 않습니다."
                status = 'fail'
            except:
                errors["undefined_exception"] = "Validation 과정에서 정의되지않은 exception이 발생하였습니다."
                status = 'fail'

        return status, errors

    def get(self, request, username):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors \
            = self.get_validation(request, status, errors, username)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        try:
            start = time.time()
            user = User.objects.get(username=username)
            account = Account.objects.get(user=user)
            student_data = account.student_data
            github_id = student_data.github_id
            commit_repos = get_commit_repos(github_id)

            repos = {}
            id_reponame_pair_list = []
            for commit in commit_repos:
                commit_repo_name = commit['repo_name']
                if commit_repo_name not in repos:
                    repos[commit_repo_name] = {'repo_name': commit_repo_name}
                    repos[commit_repo_name]['github_id'] = commit['github_id']
                    repos[commit_repo_name]['committer_date'] = commit['committer_date']
                    id_reponame_pair_list.append(
                        (commit['github_id'], commit_repo_name))
            ctx_repo_stats = []
            if len(id_reponame_pair_list) > 0:
                contr_repo_queryset = GithubRepoStats.objects.extra(
                    where=["(github_id, repo_name) in %s"], params=[tuple(id_reponame_pair_list)])
                for contr_repo in contr_repo_queryset:
                    repo_stat = contr_repo.get_guideline()
                    repo_stat['committer_date'] = repos[contr_repo.repo_name]['committer_date']
                    ctx_repo_stats.append(repo_stat)
                ctx_repo_stats = sorted(
                    ctx_repo_stats, key=lambda x: x['committer_date'], reverse=True)

            data["guideline"] = ctx_repo_stats
            print("ProfileRepoView time :", time.time() - start)
        except DatabaseError as e:
            # Database Exception handling
            status = 'fail'
            errors['DB_exception'] = 'DB Error'
        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}
        return Response(res)


class ProfileMainView(APIView):
    def get_validation(self, request, username):
        user = request.user
        status = "fail"
        errors = None
        if not user.is_authenticated:
            errors = "require_login"
        else:
            try:
                user = User.objects.get(username=username)
                status = "success"
            except User.DoesNotExist:
                errors = "user_not_found"
            except Exception as e:
                logging.exception(f'ProfileMainView undefined_exception: {e}')
                errors = "undefined_exception"
        return status, errors

    def get(self, request, username):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = self.get_validation(request, username)

        if status == 'fail':
            return Response(get_fail_res(errors))

        # Transactions
        try:
            user = User.objects.get(username=username)
            account = Account.objects.get(user=user)
            data['account'] = AccountDetailSerializer(account).data
            name = StudentTab.objects.get(id=account.student_data_id).name
            data['name'] = name

        except DatabaseError as e:
            # Database Exception handling
            status = 'fail'
            errors['DB_exception'] = 'DB Error'
        except Exception as e:
            logging.exception(f'ProfileMainView undefined_exception: {e}')
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}
        return Response(res)

    def post_validation(self, request, username):
        errors = {}
        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
        else:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                errors["user_not_found"] = "해당 유저가 존재하지 않습니다."
            except Exception as e:
                logging.exception(f'ProfileMainView undefined_exception: {e}')
                errors["undefined_exception"] = "Validation 과정에서 정의되지않은 exception이 발생하였습니다."

        return errors

    def post(self, request, username):
        '''
        introduction과 portfolio를 업데이트하는 요청 처리
        '''
        # Declaration
        data = {}
        status = 'fail'

        # Request Validation
        errors = self.post_validation(request, username)

        if errors:
            res = {'status': status, 'errors': errors}
            return Response(res)

        introduction = request.data.get('introduction', None)
        portfolio = request.data.get('portfolio', None)

        # Transactions
        try:
            account = Account.objects.get(user=request.user)
            if introduction:
                account = Account.objects.get(user=request.user)
                account.introduction = introduction
                account.save()
                data['introduction'] = introduction
            if portfolio:
                account.portfolio = portfolio
                account.save()
                data['portfolio'] = portfolio
        except DatabaseError as e:
            # Database Exception handling
            errors['DB_exception'] = 'DB Error'
        except Exception as e:
            logging.exception(
                f'ProfileIntroUpdateView undefined_exception: {e}')
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if errors:
            res = {'status': status, 'errors': errors}
        else:
            res = {'status': 'success', 'data': data}
        return Response(res)


class UserInterestTagListView(APIView):
    '''
    유저 관심분야 읽기 API
    '''

    def get_validation(self, request, status, errors, username):
        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        else:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                errors["user_not_found"] = "해당 유저가 존재하지 않습니다."
                status = 'fail'
            except:
                errors["undefined_exception"] = "Validation 과정에서 정의되지않은 exception이 발생하였습니다."
                status = 'fail'

        return status, errors

    def get(self, request, username):
        # Declaration
        data = {}
        errors = {}
        message = ''
        status = 'success'

        # Request Validation
        status, errors \
            = self.get_validation(request, status, errors, username)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        res = {'status': None, 'message': None, 'data': None}
        data = {'account': None, 'interest_tags': []}
        tag_type = request.GET.get('type', None)

        filter_kwargs = {}

        if tag_type:
            tag_type = tag_type.split(",")
            if type(tag_type) == "str":
                filter_kwargs['tag__type'] = tag_type
            else:
                filter_kwargs['tag__type__in'] = tag_type

        print("tag_type", tag_type)
        try:
            account = Account.objects.get(user__username=username)
            filter_kwargs['account'] = account
            account_tags = AccountInterest.objects.filter(**filter_kwargs)

            data['account'] = AccountSerializer(account).data
            data['interest_tags'] = AccountInterestSerializer(
                account_tags, many=True).data
            message = f'Username {username}의 태그'

        except DatabaseError as e:
            # Database Exception handling
            logging.exception(f'UserInterestTagListView DB ERROR: {e}')
            status = 'fail'
            errors['DB_exception'] = 'DB Error'
            message = '요청실패'

        except Exception as e:
            logging.exception(f'UserInterestTagListView Exception: {e}')
            status = 'fail'
            message = '요청실패'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}

        return Response(res)


class UserInterestTagUpdateView(APIView):
    '''
    유저 관심분야 수정 API
    '''

    def post_validation(self, request, status, message, errors):
        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        return status, message, errors

    def post(self, request):
        # Declaration
        data = {}
        errors = {}
        message = ''
        status = 'success'

        # Request Validation
        status, message, errors \
            = self.post_validation(request, status, message, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        user_interests = []
        try:
            user_account = Account.objects.get(user=request.user)
            account_interests = request.data.get('user_interests', [])

            with transaction.atomic():
                AccountInterest.objects.filter(
                    account=user_account, tag__type="domain").delete()
                objs = self.interests_updater(user_account, account_interests)
                interests = AccountInterest.objects.bulk_create(objs)
                data['user_interests'] = AccountInterestSerializer(
                    interests, many=True).data

            message = '관심분야를 수정했습니다.'

        except DatabaseError:
            # Database Exception handling
            status = 'fail'
            errors['DB_exception'] = 'DB Error'

        except Exception as e:
            logging.exception(f"UserInterestTagUpdateView Exception: {e}")
            status = 'fail'
            message = '유저 관심분야를 수정하는데 실패했습니다.'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}

        return Response(res)

    def interests_updater(self, account, interests):
        objs = []
        for interest in interests:
            int_tag = TagIndependent.objects.get(name=interest['value'].replace(
                "_", " ").replace("plus", "+").replace("sharp", "#"))
            new_interest_obj = AccountInterest(account=account, tag=int_tag)
            objs.append(new_interest_obj)
        return objs


class UserLangTagUpdateView(APIView):
    '''
    유저 사용언어 기술스택 수정 API
    '''

    def post_validation(self, request, status, message, errors):
        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        return status, message, errors

    def post(self, request):

        # Declaration
        data = {}
        errors = {}
        message = ''
        status = 'success'

        try:
            user_account = Account.objects.get(user=request.user)
            account_langs = request.data.get('user_langs', [])

            with transaction.atomic():
                AccountInterest.objects.filter(
                    account=user_account).exclude(tag__type='domain').delete()
                objs = self.skills_updater(user_account, account_langs)
                updated_interests = AccountInterest.objects.bulk_create(objs)

                data['user_langs'] = AccountInterestSerializer(
                    updated_interests, many=True).data
                message = '사용언어를 수정했습니다.'

        except Exception as e:
            logging.exception(f"UserLangTagUpdateView Exception: {e}")
            status = 'fail'
            message = '유저 사용언어를 수정하는데 실패했습니다.'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}

        return Response(res)

    def skills_updater(self, account, skills):
        objs = []
        for level_skills in skills.values():
            for skill in level_skills:
                lang_tag = TagIndependent.objects.get(name=skill['value'].replace(
                    "_", " ").replace("plus", "+").replace("sharp", "#"))
                new_interest_obj = AccountInterest(
                    account=account, tag=lang_tag, level=int(skill['level']))
                objs.append(new_interest_obj)
        return objs


class ProfileActivityView(APIView):
    def get_validation(self, request, status, errors, username):
        user = request.user

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        else:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                errors["user_not_found"] = "해당 유저가 존재하지 않습니다."
                status = 'fail'
            except Exception as e:
                logging.exception(f"undefined_exception: {e}")
                errors["undefined_exception"] = "Validation 과정에서 정의되지않은 exception이 발생하였습니다."
                status = 'fail'

        return status, errors

    def get(self, request, username):
        # Declaration
        data = {}
        errors = {}
        message = ''
        status = 'success'

        # Request Validation
        status, errors \
            = self.get_validation(request, status, errors, username)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        try:
            user = User.objects.get(username=username)

            try:
                account = Account.objects.get(user=user)
                portfolio = account.portfolio
                data['portfolio'] = portfolio
            except Exception as e:
                logging.exception(f"account error: {e}")
                status = 'fail'
                message = 'account error'

            # 리포지토리 목록
            github_id = account.student_data.github_id
            print(github_id)
            commit_repos = get_commit_repos(github_id)
            recent_repos = {}
            id_reponame_pair_list = []

            # 리포지토리 목록 중, 중복하지 않는 가장 최근 4개의 리포지토리 목록을 생성함
            for commit in commit_repos:
                commit_repo_name = commit['repo_name']
                if len(recent_repos) == 4:
                    break
                if commit_repo_name not in recent_repos:
                    recent_repos[commit_repo_name] = {
                        'repo_name': commit_repo_name}
                    recent_repos[commit_repo_name]['github_id'] = commit['github_id']
                    recent_repos[commit_repo_name]['committer_date'] = commit['committer_date']
                    id_reponame_pair_list.append(
                        (commit['github_id'], commit_repo_name))
            if id_reponame_pair_list:
                contr_repo_queryset = GithubRepoStats.objects.extra(
                    where=["(github_id, repo_name) in %s"], params=[tuple(id_reponame_pair_list)])
            else:
                contr_repo_queryset = []
            for contr_repo in contr_repo_queryset:
                recent_repos[contr_repo.repo_name]["desc"] = contr_repo.proj_short_desc
                recent_repos[contr_repo.repo_name]["stargazers_count"] = contr_repo.stargazers_count
                recent_repos[contr_repo.repo_name]["commits_count"] = contr_repo.commits_count
                recent_repos[contr_repo.repo_name]["prs_count"] = contr_repo.prs_count

            recent_repos = sorted(recent_repos.values(
            ), key=lambda x: x['committer_date'], reverse=True)
            data['recent_repos'] = recent_repos
        except Exception as e:
            logging.exception(f"load_repo_data error save: {e}")
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}

        return Response(res)


def get_commit_repos(github_id):
    repo_commiter_commits = GithubRepoCommits.objects.filter(committer_github=github_id).values(
        "github_id", "repo_name", "committer_date").order_by("-committer_date")
    repo_author_commits = GithubRepoCommits.objects.filter(author_github=github_id).values(
        "github_id", "repo_name", "committer_date").order_by("-committer_date")
    repo_commits = repo_commiter_commits | repo_author_commits

    return repo_commits


class ProfileInfoView(APIView):
    def get_validation(self, request, status, errors, username):
        user = request.user

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                errors["user_not_found"] = "해당 유저가 존재하지 않습니다."
                status = 'fail'
            except:
                errors["undefined_exception"] = "Validation 과정에서 정의되지않은 exception이 발생하였습니다."
                status = 'fail'

        return status, errors

    def get(self, request, username):
        # Declaration
        data = {}
        errors = {}
        message = ''
        status = 'success'

        # Request Validation
        status, errors \
            = self.get_validation(request, status, errors, username)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions

        try:
            user = User.objects.get(username=username)
            account = Account.objects.get(user=user)
            studenttab = StudentTab.objects.get(id=account.student_data_id)

            data['student'] = StudentSerializer(studenttab).data

        except DatabaseError as e:
            # Database Exception handling
            status = 'fail'
            errors['DB_exception'] = 'DB Error'
        except Exception as e:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'
            logging.exception(f"undefined_exception: {e}")

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}

        return Response(res)


class ProfileImageView(APIView):
    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'

        user = request.user
        user_account = Account.objects.get(user=user.id)

        pre_img = user_account.photo.path

        field_check_list = {}

        profile_img = request.FILES.get('photo', False)
        print("profile_img", profile_img)
        is_valid = True
        print(request.POST.get('is_default'))

        if request.POST.get('is_default') == 'true':
            print("is true!!")

        if profile_img:
            img_width, img_height = get_image_dimensions(profile_img)
            print(img_width, img_height)
            if img_width > 500 or img_height > 500:
                is_valid = False
                field_check_list[
                    'photo'] = f'이미지 크기는 500px \u00d7 500px 이하입니다. 현재 {img_width}px \u00d7 {img_height}px'
                print(
                    f'이미지 크기는 500px \u00d7 500px 이하입니다. 현재 {img_width}px \u00d7 {img_height}px')

        img_form = ProfileImgUploadForm(
            request.POST, request.FILES, instance=user_account)
        img_form.save()
        print("img_form", img_form)
        print("pre_img", pre_img)
        if bool(img_form.is_valid()) and is_valid:
            if 'photo' in request.FILES:  # 폼에 이미지가 있으면
                print('form에 이미지 존재')
                try:
                    print(" path of pre_image is " + pre_img)
                    if (pre_img.split("/")[-1] == "default.jpg" or pre_img.split("\\")[-1] == "default.jpg"):
                        pass
                    else:
                        print("기존이미지를 삭제합니다.")
                        print(pre_img.split("/")[-1])
                        os.remove(pre_img)  # 기존 이미지 삭제

                except:                # 기존 이미지가 없을 경우에 pass
                    pass

            print('Image is valid form')

            print(user_account.photo.path)

            img_form.save()
            user_account.save()
            print("세이브 완료되면출력되는 문구")

        else:
            print("not vaild", field_check_list['photo'])
        res = {"status": status}
        return Response(res)


class ProfileImageDefaultView(APIView):
    def post(self, request, username, *args, **kwargs):
        status = 'success'
        user = User.objects.get(username=username)
        user_account = Account.objects.get(user=user.id)
        user_account.photo = "img/profile_img/default.jpg"
        user_account.save()
        res = {"status": status}
        return Response(res)


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

        # github_score_result의 best_repo를 객체로 변경
        # best_repo를 이용해 repo stat과 repo commit line을 구함
        github_score_result = GithubScoreResultSerializer(
            score, many=True).data
        for obj in github_score_result:
            year, repo = obj['year'], obj['best_repo']
            if '/' in repo:
                [owner_id, repo_name] = repo.split('/')
                try:
                    # GithubRepoStats에 커밋 라인 수 데이터가 없어 따로 계산
                    commit_data = GithubRepoCommits.objects.filter(
                        github_id=owner_id, repo_name=repo_name).aggregate(
                        commit_lines=Sum('additions')+Sum('deletions')
                    )
                    repo_stat = GithubRepoStats.objects.get(
                        github_id=owner_id, repo_name=repo_name)
                    repo_stat = repo_stat.get_factors()
                    repo_stat['commit_lines'] = commit_data['commit_lines']
                    obj['best_repo'] = repo_stat

                except ObjectDoesNotExist as e:
                    logging.exception(f'repo {repo} is not exist: {e}')
                    obj['best_repo'] = None

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
        start = time.time()
        target_account, error = get_account_valid(request, username)
        if error:
            return Response(get_fail_res(error_code=error))
        github_id = target_account.github_id
        data = get_dev_tendency(target_account, github_id)
        coworkers = get_coworkers(github_id)
        data['coworkers'] = coworkers

        print("UserDevTendencyView elapsed time", time.time() - start)

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


class TotalContrView(APIView):
    def get(self, request, username):
        res = {'status': 'success', 'data': None}
        try:
            target_account, error = get_account_valid(request, username)
            if error:
                return Response(get_fail_res(error_code=error))
            github_id = target_account.github_id
            contr_repo = get_contr_repos(github_id)
            data = {'repo_num': len(contr_repo)}

            contrs = get_total_contrs(github_id)
            data.update(contrs)
            res['data'] = data
        except ObjectDoesNotExist as e:
            logging.exception(f'{e}')
            return Response(get_fail_res('object_not_found'))
        except Exception as e:
            logging.exception(f'TotalContrView Exception: {e}')
            return Response(get_fail_res('undefined_exception'))

        return Response(res)


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
    dev_tendency['details'] = get_type_analysis(list(dev_tendency.values()))
    data["dev_tendency"] = dev_tendency

    try:
        # 개발자 성향 차트를 그리기 위한 데이터 추가
        dev_tendency_data = {}
        dev_tendency_data["typeE_data"] = hour_dist
        dev_tendency_data["typeE_sector"] = [
            int(daytime_min/3600), int(daytime_max/3600)]
        dev_tendency_data["typeF_data"] = commit_freq_dist
        dev_tendency_data["typeG_data"] = [indi_num, group_num]
        data["dev_tendency_data"] = dev_tendency_data
    except Exception as e:
        logging.exception(f"Get Type data error: {e}")

    return data


def get_coworkers(github_id):
    '''
    GitHub ID를 이용해 리포지토리에서 협업한 유저를 찾는 함수
    '''
    # 기여한 리포지토리의 목록 조회
    subquery = GithubRepoContributor.objects.filter(
        github_id=github_id).values_list('repo_name', 'owner_id')
    # 기여 리포지토리에 존재하는 기여자 목록 쿼리
    coworkers = []
    if subquery:
        coworker_github_ids = GithubRepoContributor.objects.filter(
            (Q(repo_name__in=[item[0] for item in subquery]) &
             Q(owner_id__in=[item[1] for item in subquery]))
        ).values_list('github_id', flat=True).distinct()
        coworker_github_ids = list(coworker_github_ids)
        coworker_github_ids.remove(github_id)
        # 자기자신 삭제
        coworkers = Account.objects.filter(
            student_data__github_id__in=coworker_github_ids)
        coworkers = AccountSerializer(coworkers, many=True).data

    return coworkers


def get_dev_type(account, github_id):
    data = {'dev_type': None}
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
        data['dev_type'] = dev_type

    return data


def get_total_contrs(github_id):
    total_contrs = GitHubScoreTable.objects.filter(github_id=github_id).aggregate(commits=Sum(
        'commit_cnt'), commit_lines=Sum('commit_line'), issues=Sum('issue_cnt'), prs=Sum('pr_cnt'))
    return total_contrs


def get_contr_repos(github_id):
    student = StudentTab.objects.get(github_id=github_id)
    pri_email = student.primary_email
    sec_email = student.secondary_email

    commit_data = GithubRepoCommits.objects.filter(
        (Q(author_github=github_id) | Q(author=pri_email) | Q(author=sec_email))
    ).values_list('github_id', 'repo_name').distinct()

    issue_data = GithubIssues.objects.filter(
        github_id=github_id).values_list('owner_id', 'repo_name').distinct()

    pull_data = GithubPulls.objects.filter(
        github_id=github_id).values_list('owner_id', 'repo_name').distinct()

    contr_repos = set(commit_data).union(issue_data).union(pull_data)
    contr_repos = [f'{x[0]}/{x[1]}' for x in contr_repos]

    return contr_repos


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
        type_factors = request.data.get('factor')
        if type_factors is None:
            appended_msg = get_missing_data_msg('factor')
            return Response(get_fail_res('missing_required_data', appended_msg))
        try:
            account = Account.objects.get(user__username=username)
        except ObjectDoesNotExist:
            logging.error(f"account DoesNotExist {e}")
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
