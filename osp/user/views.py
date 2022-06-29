from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.models import User
from django.views.generic import TemplateView
from user.models import ScoreTable, StudentTab, GithubScore, Account, GithubStatsYymm
from home.models import AnnualOverview, AnnualTotal, DistFactor, DistScore, Repository, Student
from django.contrib.auth.decorators import login_required
from repository.models import GithubRepoStats, GithubRepoContributor, GithubRepoCommits, GithubIssues, GithubPulls
import time
import json

# Create your views here.
class ProfileView(TemplateView):

    template_name = 'profile/profile.html'
    # 새로 고침 시 GET 요청으로 처리됨.
    def get(self, request, *args, **kwargs):

        context = self.get_context_data(request, *args, **kwargs)
        student_id = context["student_id"]
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
        student_info = StudentTab.objects.get(id=student_id)
        student_score = ScoreTable.objects.get(id=student_id, year=2021)

        
        commit_repos = GithubRepoCommits.objects.filter(committer_github=github_id).values("repo_name", "committer_date").order_by("repo_name").distinct()
        commit_repos = commit_repos.values("repo_name", "committer_date")
        sorted_commit = sorted(commit_repos, key=lambda x:x['committer_date'], reverse=True)

        recent_repos = []
        cur = 0
        while(cur < len(sorted_commit)):
            if(len(recent_repos) == 4):
                break
            cur_repo = sorted_commit[cur]
            flag = 1
            for i in range(len(recent_repos)):
                if (recent_repos[i]['repo_name'] == cur_repo['repo_name']):
                    flag = 0
                    break
            if(flag == 1):
                recent_repos.append(cur_repo)
            cur = cur + 1

        

        data = {}
        data['info'] = student_info
        data['score'] = student_score
        data['repos'] = recent_repos
        data['last'] = last_commits
        context["data"] = data

        return render(request=request, template_name=self.template_name, context=context)

    def get_context_data(self, request, *args, **kwargs):
        
        start = time.time()  # 시작 시간 저장
        
        context = super().get_context_data(**kwargs)
        print(context)
        user = User.objects.get(username=context["username"])
        student_data = Account.objects.get(user=user).student_data
        github_id = student_data.github_id
        
        chartdata = {}
        score_data_list = []
        context["user_type"] = 'user'
        context["student_id"] = student_data.id
        annual_overview = AnnualOverview.objects.get(case_num=0)
        chartdata["annual_overview"] = annual_overview.to_avg_json()
        user_data = Student.objects.filter(github_id=github_id)
        chartdata["user_data"] = json.dumps([row.to_json() for row in user_data])
        
        monthly_contr = []
        for year in range(2019, 2022):
            # user MODEL GithubStatsYymm
            month_data = GithubStatsYymm.objects.filter(github_id=github_id, start_yymm__year=year)
            print("month_data len", len(month_data))
            monthly_contr.append(json.dumps([row.to_json() for row in month_data]))
            
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
        
        context["chart_data"] = json.dumps(chartdata)
        print("\ntime :", time.time() - start)  # 현재시각 - 시작시간 = 실행 시간
        
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
