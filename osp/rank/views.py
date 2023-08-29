from rest_framework.response import Response
from rest_framework.views import APIView

from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from repository.models import GithubRepoStats, GithubRepoContributor, GithubRepoCommits, GithubIssues, GithubPulls
from repository.serializers import GithubRepoContributorSerializer, GithubRepoStatsSerializer
from user.models import GitHubScoreTable, StudentTab, Account
from user.serializers import GithubScoreTableSerializer

import logging
import time


class UserRanking(APIView):
    def get_validation(self, request):
        status = 'fail'
        errors = {}

        user = request.user

        try:
            if not user.is_superuser:
                errors["user_is_not_superuser"] = "어드민계정만 접근할 수 있습니다."
            else:
                user = User.objects.get(id=user.id)
                status = 'success'
        except User.DoesNotExist:
            logging.exception(f'UserRanking user_not_found: {e}')
            errors["user_not_found"] = "해당 유저가 존재하지 않습니다."
        except Exception as e:
            logging.exception(f'UserRanking undefined_exception: {e}')
            errors["undefined_exception"] = "Validation 과정에서 정의되지않은 exception이 발생하였습니다."

        return status, errors

    def get(self, request):
        res = {"status": "fail", "errors": None, "data": None}
        data = {}
        status, errors = self.get_validation(request)
        if status == 'fail':
            res['errors'] = errors
            return Response(res)

        distinct_years = list(GitHubScoreTable.objects.values_list(
            'year', flat=True).distinct())

        # 학번에 따른 username을 얻기위한 딕셔너리 구성
        student_user_relations = {}
        account_maps = Account.objects.exclude(student_data=None).values(
            'user__username', 'student_data_id')
        for map in account_maps:
            student_id = map['student_data_id']
            username = map['user__username']
            student_user_relations[student_id] = username

        target_year = request.GET.get('year', None)
        if target_year:
            score_table = GitHubScoreTable.objects.filter(year=target_year)
        else:
            score_table = GitHubScoreTable.objects.all()

        if not score_table.exists():
            errors["data_not_found"] = "데이터가 존재하지 않습니다."
            res['status'] = 'fail'
            res['errors'] = errors
            return Response(res)
        score_table_data = GithubScoreTableSerializer(
            score_table, many=True).data
        sorted_score_by_year = sorted(
            score_table_data, key=lambda x: x['score'], reverse=True)

        # 랭킹 부여
        rank = 1
        for idx, row in enumerate(sorted_score_by_year):
            if idx > 0 and sorted_score_by_year[idx]['score'] != sorted_score_by_year[idx - 1]['score']:
                rank += 1
            row['rank'] = rank
            if row['id'] in student_user_relations:
                row['username'] = student_user_relations[row['id']]
            else:
                # 계정정보는 없고(삭제되었고) 수집데이터만 존재하는 경우
                row['username'] = None

        data['score_table'] = score_table_data
        data['years'] = distinct_years
        res['data'] = data
        res['status'] = status

        return Response(res)


class RepoRanking(APIView):
    def get_validation(self, request):
        status = 'fail'
        errors = {}

        user = request.user

        try:
            if not user.is_superuser:
                errors["user_is_not_superuser"] = "어드민계정만 접근할 수 있습니다."
            else:
                user = User.objects.get(id=user.id)
                status = 'success'
        except User.DoesNotExist:
            logging.exception(f'UserRanking user_not_found: {e}')
            errors["user_not_found"] = "해당 유저가 존재하지 않습니다."
        except Exception as e:
            logging.exception(f'UserRanking undefined_exception: {e}')
            errors["undefined_exception"] = "Validation 과정에서 정의되지않은 exception이 발생하였습니다."

        return status, errors

    def get(self, request):
        start = time.time()
        res = {"status": "fail", "errors": None, "data": None}
        data = {}
        status, errors = self.get_validation(request)
        if status == 'fail':
            res['errors'] = errors
            return Response(res)

        # repo와 contributor의 관계 모델에서 repo 별 contributor의 리스트를 구함
        repo_contrib_collections = {}
        repo_contribs_queryset = GithubRepoContributor.objects.all()
        repo_contribs = GithubRepoContributorSerializer(
            repo_contribs_queryset, many=True).data

        for contrib in repo_contribs:
            repo = f"{contrib['owner_id']}/{contrib['repo_name']}"
            if repo not in repo_contrib_collections:
                repo_contrib_collections[repo] = []
            repo_contrib_collections[repo].append(contrib)

        repo_list = []
        repo_stats = GithubRepoStats.objects.all()
        repo_stats = GithubRepoStatsSerializer(repo_stats, many=True).data
        for repo in repo_stats:
            repo_link = f"{repo['github_id']}/{repo['repo_name']}"
            if repo_link in repo_contrib_collections:
                repo['contribs'] = repo_contrib_collections[repo_link]
                if (repo['stargazers_count'] is not None and
                    repo['forks_count'] is not None and
                    repo['commits_count'] is not None and
                    repo['prs_count'] is not None and
                    repo['open_issue_count'] is not None and
                        repo['close_issue_count'] is not None):
                    repo['repo_link'] = repo_link
                    repo['issues_count'] = repo['open_issue_count'] + \
                        repo['close_issue_count']

                    repo_list.append(repo)

        data['repos'] = repo_list
        res['data'] = data
        res['status'] = status
        print("RepoRanking elapsed time: ", time.time()-start)

        return Response(res)


class RepoContrib(APIView):
    def get(self, request):
        res = {'status': 'success', 'data': None}
        owner_id = request.GET.get('github_id')
        repo_name = request.GET.get('repo_name')
        result = []
        try:
            for student in GithubRepoContributor.objects.filter(owner_id=owner_id).filter(repo_name=repo_name):
                student_profile = list(
                    StudentTab.objects.filter(github_id=student.github_id))
                if len(student_profile) != 1:
                    continue
                commmit_cnt = len(GithubRepoCommits.objects.filter(
                    github_id=owner_id,
                    repo_name=repo_name,
                    committer_github=student.github_id
                ))
                issue_cnt = len(GithubIssues.objects.filter(
                    owner_id=owner_id,
                    repo_name=repo_name,
                    github_id=student.github_id
                ))
                pull_cnt = len(GithubPulls.objects.filter(
                    owner_id=owner_id,
                    repo_name=repo_name,
                    github_id=student.github_id
                ))
                result.append({
                    'name': student_profile[0].name,
                    'github_id': student.github_id,
                    'commit_cnt': commmit_cnt,
                    'issue_cnt': issue_cnt,
                    'pull_cnt': pull_cnt
                })
        except Exception as e:
            logging.exception(f"RepoContrib Exception {e}")
            res['stauts'] = 'fail'
        res['data'] = result

        return Response(res)


@login_required
def user_rank(request):
    # 쿼리스트링으로 연도 받음
    get_year = request.GET.get('year')
    # Split by Year
    score_by_year = {}
    score_table_all = GitHubScoreTable.objects.all()
    for student in score_table_all:
        if student.year not in score_by_year:
            score_by_year[student.year] = []
        score_by_year[student.year].append(student)
    select_year = "ALL"

    # 전달받은 연도의 유저 테이블 데이터를 반환
    def sort_year_student(year):
        year_student_list = []
        sorted_score_by_year = sorted(
            score_by_year[year], key=lambda x: x.total_score, reverse=True)
        rank = 1
        for idx, row in enumerate(sorted_score_by_year):
            if idx > 0 and sorted_score_by_year[idx].total_score != sorted_score_by_year[idx - 1].total_score:
                rank += 1
            row.rank = rank
            year_student_list.append(row)
        return year_student_list

    student_list = []
    # Sort each year data
    if get_year and get_year.isdecimal():
        # 쿼리스트링 연도
        select_year = int(get_year)
        student_list = sort_year_student(select_year)
    else:
        # 전체 연도
        for year in score_by_year:
            student_list += sort_year_student(year)

    return render(request, 'rank/user_rank.html', {'data': student_list, 'select_year': select_year, 'year_list': score_by_year.keys()})


@login_required
def repo_rank(request):
    repo_list = []
    student_contributor = {}
    for x in GithubRepoContributor.objects.all():
        if x.owner_id + '/' + x.repo_name not in student_contributor:
            student_contributor[x.owner_id + '/' + x.repo_name] = []
        student_contributor[x.owner_id + '/' + x.repo_name].append(x)
    for repo in GithubRepoStats.objects.all():
        repo_link = repo.github_id + '/' + repo.repo_name
        if repo_link in student_contributor:
            repo.student_contributor = student_contributor[repo_link]
            if (repo.stargazers_count is not None and repo.forks_count is not None
                    and repo.commits_count is not None and repo.prs_count is not None):
                repo_list.append(repo)
    return render(request, 'rank/repo_rank.html', {'data': repo_list})


def repo_api(request):
    owner_id = request.GET['github_id']
    repo_name = request.GET['repo_name']
    result = []
    for student in GithubRepoContributor.objects.filter(owner_id=owner_id).filter(repo_name=repo_name):
        student_profile = list(
            StudentTab.objects.filter(github_id=student.github_id))
        if len(student_profile) != 1:
            continue
        commmit_cnt = len(GithubRepoCommits.objects.filter(
            github_id=owner_id,
            repo_name=repo_name,
            committer_github=student.github_id
        ))
        issue_cnt = len(GithubIssues.objects.filter(
            owner_id=owner_id,
            repo_name=repo_name,
            github_id=student.github_id
        ))
        pull_cnt = len(GithubPulls.objects.filter(
            owner_id=owner_id,
            repo_name=repo_name,
            github_id=student.github_id
        ))
        result.append({
            'name': student_profile[0].name,
            'github_id': student.github_id,
            'commit_cnt': commmit_cnt,
            'issue_cnt': issue_cnt,
            'pull_cnt': pull_cnt
        })
    return JsonResponse(result, safe=False)
