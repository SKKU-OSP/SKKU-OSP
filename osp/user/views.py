from django.shortcuts import render
from django.views.generic import TemplateView
from user.models import StudentTab, ScoreTable
from repository.models import GithubRepoStats, GithubRepoContributor, GithubRepoCommits, GithubIssues, GithubPulls
# from ..repository.models import *

from django.db.models import Max, Min

# Create your views here.

def get_repos(cur_repo_type, github_id):
    if(cur_repo_type == "owned"):
        return get_owned_repos(github_id)
    else:
        return get_contr_repos(github_id)
def get_owned_repos(github_id):
    owned_repos = []
    o_repo_names = list(GithubRepoStats.objects.filter(github_id=github_id).values_list("repo_name", flat=True))
    for repo_name in o_repo_names:
        repo_info = {}
        repo_info['name'] = repo_name

        commits = GithubRepoCommits.objects.filter(github_id=github_id, repo_name=repo_name)
        pulls = GithubPulls.objects.filter(owner_id=github_id, repo_name=repo_name)
        issues = GithubPulls.objects.filter(owner_id=github_id, repo_name=repo_name)

        if commits or pulls or issues:
            max_dates = [commits.aggregate(Max('committer_date')).get('committer_date__max').date(),
                         pulls.aggregate(Max('date')).get('date__max'), issues.aggregate(Max('date')).get('date__max')]
            max_year = max(x for x in max_dates if x is not None).year
            min_dates = [commits.aggregate(Min('committer_date')).get('committer_date__min').date(),
                         pulls.aggregate(Min('date')).get('date__min'), issues.aggregate(Min('date')).get('date__min')]
            min_year = max(x for x in min_dates if x is not None).year

        records = []
        if min_year and max_year:
            for year in range(min_year, max_year + 1):
                record_info = {}
                record_info['year'] = year
                record_info['commit_cnt'] = commits.filter(committer_date__year=year).count()
                record_info['pr_cnt'] = pulls.filter(date__year=year).count()
                record_info['issue_cnt'] = issues.filter(date__year=year).count()

                records.append(record_info)

        repo_info['records'] = records
        owned_repos.append(repo_info)
    return owned_repos
def get_contr_repos(github_id):
    repos = []
    return repos


class ProfileView(TemplateView):
    template_name = 'profile.html'
    # 새로 고침 시 GET 요청으로 처리됨.
    def get(self, request, *args, **kwargs):
        student_id = self.kwargs.get('student_id')

        context = self.get_context_data(request, *args, **kwargs)

        std = StudentTab.objects.filter(id=student_id)

        # 화면 에러 처리
        if std.count() < 1:
            context['std'] = None

        # 정보를 가져옴.
        else:
            # student info
            context['std'] = std.get()
            github_id = context['std'].github_id
            # student score info
            score = ScoreTable.objects.filter(name=github_id).filter(year=2021)
            if score:
                context['score'] = score.first().total_score
            # student repository info
            context['cur_repo_type'] = 'owned'
            ## owned repository
            context['repos'] = get_repos(context['cur_repo_type'], github_id)
            print(context['repos'])

        return render(request=request, template_name=self.template_name, context=context)

    # ajax 요청 시 POST로 처리됨.(owned/ contributed repository Tab)
    def post(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        # POST 요청 시 예외 처리 안함.
        std = self.POST.get('student_id')
        context['std'] = std

        github_id = StudentTab.objects.first(id=std.id).github_id

        context['cur_repo_type'] = self.POST.get('cur_repo_type')
        context['repos'] = get_repos(context['cur_repo_type'], github_id)


    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context
