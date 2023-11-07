import logging

from django.contrib.auth.models import User
from django.db import DatabaseError, transaction
from rest_framework.response import Response
from rest_framework.views import APIView

from handle_error import get_fail_res
from repository.models import GithubRepoCommits, GithubRepoStats
from tag.models import TagIndependent
from user.models import Account, AccountInterest, StudentTab
from user.serializers import (AccountDetailSerializer,
                              AccountInterestSerializer, AccountSerializer,
                              StudentSerializer)


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
            commit_repos = self.get_commit_repos(github_id)
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
            contr_repo_queryset = GithubRepoStats.objects.extra(
                where=["(github_id, repo_name) in %s"], params=[tuple(id_reponame_pair_list)])
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

    def get_commit_repos(self, github_id):
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
