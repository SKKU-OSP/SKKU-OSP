from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.models import User
from django.views.generic import TemplateView
from user.models import ScoreTable, StudentTab, GithubScore, Account, AccountInterest, GithubStatsYymm
from home.models import AnnualOverview, AnnualTotal, DistFactor, DistScore, Repository, Student
from django.contrib.auth.decorators import login_required
from repository.models import GithubRepoStats, GithubRepoContributor, GithubRepoCommits, GithubIssues, GithubPulls
from django.db.models import Avg, Sum
import time
import json

# Create your views here.
class ProfileView(TemplateView):

    template_name = 'profile/profile.html'
    # 새로 고침 시 GET 요청으로 처리됨.
    def get(self, request, *args, **kwargs):

        context = self.get_context_data(request, *args, **kwargs)
        std = context['account'].student_data

        # 정보를 가져옴.
        # student info
        context['std'] = std
        github_id = context['std'].github_id
        # student score info
        score = ScoreTable.objects.filter(name=github_id).filter(year=2021)
        if score:
            context['score'] = score.first().total_score
        # student repository info
        context['cur_repo_type'] = 'owned'
        ## owned repository
        student_info = std
        student_score = ScoreTable.objects.get(id=std.id, year=2021)

        
        # 최근 기여 리포지토리 목록
        commit_repos = GithubRepoCommits.objects.filter(committer_github=github_id).values("github_id", "repo_name", "committer_date").order_by("repo_name").distinct()
        commit_repos = commit_repos.values("github_id", "repo_name", "committer_date")
        sorted_commit = sorted(commit_repos, key=lambda x:x['committer_date'], reverse=True) # committer_date 기준 정렬

        recent_repos = {}
        cur = 0

        # 최근 기여 리포지토리 목록 중, 중복하지 않는 가장 최근 4개의 리포지토리 목록을 셍성함
        for commit in sorted_commit:
            if len(recent_repos) == 4:
                break
            if commit['repo_name'] not in recent_repos:
                recent_repos[commit['repo_name']] = {'repo_name': commit['repo_name']}
            recent_repos[commit['repo_name']]['github_id'] = commit['github_id']
            recent_repos[commit['repo_name']]['committer_date'] = commit['committer_date']
            recent_repos[commit['repo_name']]['desc'] = GithubRepoStats.objects.get(github_id=commit['github_id'], repo_name=commit['repo_name']).proj_short_desc
        recent_repos = sorted(recent_repos.values(), key=lambda x:x['committer_date'], reverse=True)
        # 관심 목록 리스트
        
        ints = AccountInterest.objects.filter(account=context['account'])

        data = {}

        data['info'] = student_info
        data['score'] = student_score
        data['repos'] = recent_repos
        data['inter'] = ints

        context['data'] = data

        return render(request=request, template_name=self.template_name, context=context)

    def get_context_data(self, request, *args, **kwargs):
        
        start = time.time()  # 시작 시간 저장
        
        context = super().get_context_data(**kwargs)
        user = User.objects.get(username=context["username"])
        account = Account.objects.get(user=user)
        context['account'] = account
        student_data = account.student_data
        github_id = student_data.github_id
        
        chartdata = {}
        score_data_list = []
        context["user_type"] = 'user'
        context["student_id"] = student_data.id
        annual_overview = AnnualOverview.objects.get(case_num=0)
        chartdata["annual_overview"] = annual_overview.to_avg_json()
        user_data = Student.objects.filter(github_id=github_id)
        chartdata["user_data"] = json.dumps([row.to_json() for row in user_data])
        
        star_data = GithubRepoStats.objects.extra(
            tables=['github_repo_contributor'], 
            where=["github_repo_contributor.repo_name=github_repo_stats.repo_name", "github_repo_contributor.owner_id=github_repo_stats.github_id"]).values('github_id').annotate(star=Sum("stargazers_count")
        )

        own_star_list = []
        for row in star_data:
            own_star_list.append(row)
        
        monthly_contr = []
        monthly_avg = []
        for year in range(2019, 2022):
            # user MODEL GithubStatsYymm
            month_data = GithubStatsYymm.objects.filter(github_id=github_id, start_yymm__year=year)
            monthly_contr.append(json.dumps([row.to_json() for row in month_data]))
            
            monthly_avg_queryset = GithubStatsYymm.objects.exclude(num_of_cr_repos=0, num_of_co_repos=0, num_of_commits=0, num_of_prs=0, num_of_issues=0).filter(start_yymm__year=year).values('start_yymm').annotate(commit=Avg("num_of_commits"), pr=Avg("num_of_prs"), issue=Avg("num_of_issues"), repo_cr=Avg("num_of_cr_repos"), repo_co=Avg("num_of_co_repos")).order_by('start_yymm')
            month_data = []
            for row in monthly_avg_queryset:
                row["year"] = row["start_yymm"].year
                row["month"] =  row["start_yymm"].month
                row.pop('start_yymm', None)
                month_data.append(row)
                
            monthly_avg.append(month_data)
            
            # home MODEL DistScore
            dist_score = DistScore.objects.get(case_num=0, year=year)
            annual_dist = dist_score.to_json()
            
            # home MODEL DistFactor
            dist_factor = DistFactor.objects.filter(case_num=0, year=year)
            for row in dist_factor:
                row_json = row.to_json()
                factor = row_json["factor"]
                row_json[factor] = row_json.pop("value")
                row_json[factor+"_sid"] = row_json.pop("value_sid")
                row_json[factor+"_sid_pct"] = row_json.pop("value_sid_pct")
                row_json[factor+"_dept"] = row_json.pop("value_dept")
                row_json[factor+"_dept_pct"] = row_json.pop("value_dept_pct")
                annual_dist.update(row_json)
            key_name = "year"+str(year)
            chartdata[key_name] = json.dumps([annual_dist])
            
            score_data = GithubScore.objects.get(yid=str(year)+github_id)
            score_data_list.append(score_data.to_json())
        chartdata["score_data"] = score_data_list
        chartdata["monthly_contr"] = monthly_contr
        chartdata["monthly_avg"] = monthly_avg
        chartdata["own_star"] = own_star_list
        
        context["chart_data"] = json.dumps(chartdata)
        print("\nProfileView time :", time.time() - start)  # 현재시각 - 시작시간 = 실행 시간
        
        return context

class ProfileEditView(TemplateView):

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)

        username = context['username']
        user = User.objects.get(username=username)
        student_id = Account.objects.get(user=user.id).student_data.id
        student_info = StudentTab.objects.get(id=student_id)
        data = {}
        data['info'] = student_info

        return render(request, 'profile/profile-edit.html', {'data': data})

    def get_context_data(self, request, *args, **kwargs):
        
        context = super().get_context_data(**kwargs)
        return context

def student_id_to_username(request, student_id):
    username = Account.objects.get(student_data=student_id).user.username
    return redirect(f'/user/{username}/')
