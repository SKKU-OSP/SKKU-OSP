from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.models import User
from django.contrib import messages
from django.views.generic import TemplateView
from user.models import ScoreTable, StudentTab, GithubScore, Account, AccountInterest, GithubStatsYymm
from home.models import AnnualOverview, AnnualTotal, DistFactor, DistScore, Repository, Student
from tag.models import Tag
from django.contrib.auth.decorators import login_required
from repository.models import GithubRepoStats, GithubRepoContributor, GithubRepoCommits, GithubIssues, GithubPulls

from user.forms import ProfileInfoUploadForm, ProfileImgUploadForm, PortfolioUploadForm
from django.db.models import Avg, Sum, Subquery

import time
import json
import os

# Create your views here.
class ProfileView(TemplateView):

    template_name = 'profile/profile.html'
    start_year = 2019
    end_year = 2021
    # 새로 고침 시 GET 요청으로 처리됨.
    def get(self, request, *args, **kwargs):

        context = self.get_context_data(request, *args, **kwargs)
        std = context['account'].student_data

        # 정보를 가져옴.
        # student info
        context['std'] = std
        github_id = context['std'].github_id
        # student repository info
        context['cur_repo_type'] = 'owned'
        ## owned repository
        student_info = std
        student_score = ScoreTable.objects.get(id=std.id, year=2021)

        # 최근 기여 리포지토리 목록
        commit_repos = GithubRepoCommits.objects.filter(committer_github=github_id).values("github_id", "repo_name", "committer_date").order_by("-committer_date")
        recent_repos = {}

        # 최근 기여 리포지토리 목록 중, 중복하지 않는 가장 최근 4개의 리포지토리 목록을 셍성함
        for commit in commit_repos:
            commit_repo_name = commit['repo_name']
            if len(recent_repos) == 3:
                break
            if commit_repo_name not in recent_repos:
                recent_repos[commit_repo_name] = {'repo_name': commit_repo_name}
                recent_repos[commit_repo_name]['github_id'] = commit['github_id']
                recent_repos[commit_repo_name]['committer_date'] = commit['committer_date']
                recent_repos[commit_repo_name]['desc'] = GithubRepoStats.objects.get(github_id=commit['github_id'], repo_name=commit_repo_name).proj_short_desc
        recent_repos = sorted(recent_repos.values(), key=lambda x:x['committer_date'], reverse=True)
       
        # 관심 목록 리스트
        
        ints = AccountInterest.objects.filter(account=context['account'])
        # 프로필사진 경로
        
        data = {
            'info': student_info,
            'score': student_score,
            'repos': recent_repos,
            'inter': ints,
            'account': context['account']
        }
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
        student = StudentTab.objects.all()
        star_data = GithubRepoStats.objects.filter(github_id__in=Subquery(student.values('github_id'))).extra(tables=['github_repo_contributor'], where=["github_repo_contributor.repo_name=github_repo_stats.repo_name", "github_repo_contributor.owner_id=github_repo_stats.github_id", "github_repo_stats.github_id = github_repo_contributor.github_id"]).values('github_id').annotate(star=Sum("stargazers_count"))
        
        own_star = {}
        own_star_list = []
        star_sum = 0
        for row in star_data:
            own_star_list.append(row)
            star_sum += row["star"]
            if row["github_id"] == github_id:
                own_star["star"] = row["star"]
        own_star["avg"] = star_sum/len(star_data)
        own_star["own_star_list"] = own_star_list
        
        annual_dist = {}
        dist_score_total = DistScore.objects.filter(case_num=0)
        for row in dist_score_total:
            row_json = row.to_json()
            annual_dist[row_json["year"]] = row_json
            
        dist_factor_total = DistFactor.objects.filter(case_num=0)
        for row in dist_factor_total:
            row_json = row.to_json()
            factor = row_json["factor"]
            row_json[factor] = row_json.pop("value")
            row_json[factor+"_sid"] = row_json.pop("value_sid")
            row_json[factor+"_sid_pct"] = row_json.pop("value_sid_pct")
            row_json[factor+"_dept"] = row_json.pop("value_dept")
            row_json[factor+"_dept_pct"] = row_json.pop("value_dept_pct")
            annual_dist[row_json["year"]].update(row_json)
        for annual_key in annual_dist.keys():
            key_name = "year"+str(annual_key)
            chartdata[key_name] = json.dumps([annual_dist[annual_key]])
            
        score_data = GithubScore.objects.filter(github_id=github_id)
        for row in score_data:
            score_data_list.append(row.to_json())
        chartdata["score_data"] = score_data_list
        
        # #여기에 star정보만 얹으면 됨
        monthly_contr = [ [] for i in range(self.end_year-self.start_year+1)]
        gitstat_year = GithubStatsYymm.objects.filter(github_id=github_id)
        for row in gitstat_year:
            row_json = row.to_json()
            row_json['star'] = own_star["star"]
            if row_json["year"] >= self.start_year :
                monthly_contr[row_json["year"]-self.start_year].append(row_json)
        
        total_avg_queryset = GithubStatsYymm.objects.exclude(num_of_cr_repos=0, num_of_co_repos=0, num_of_commits=0, num_of_prs=0, num_of_issues=0).values('start_yymm').annotate(commit=Avg("num_of_commits"), pr=Avg("num_of_prs"), issue=Avg("num_of_issues"), repo_cr=Avg("num_of_cr_repos"), repo_co=Avg("num_of_co_repos")).order_by('start_yymm')
        
        monthly_avg = []
        for year in range(self.start_year, self.end_year+1):
            
            monthly_avg_queryset = total_avg_queryset.filter(start_yymm__year=year)
            month_data = []
            for row in monthly_avg_queryset:
                row["year"] = row["start_yymm"].year
                row["month"] =  row["start_yymm"].month
                row.pop('start_yymm', None)
                month_data.append(row)
            monthly_avg.append(month_data)
            
        chartdata["monthly_contr"] = monthly_contr
        chartdata["own_star"] = own_star
        chartdata["monthly_avg"] = monthly_avg
        
        context["chart_data"] = json.dumps(chartdata)
        print("\nProfileView time :", time.time() - start)  # 현재시각 - 시작시간 = 실행 시간
        
        return context

class ProfileEditView(TemplateView):

    def post(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        username = context['username']

        user = User.objects.get(username=username)
        user_account = Account.objects.get(user=user.id)
        student_id = user_account.student_data.id
        user_tab = StudentTab.objects.get(id=student_id)

        info_form = ProfileInfoUploadForm(request.POST, request.FILES, instance=user_tab)

        added_preferLanguage = request.POST.get('preferLanguage') # 선택 된 태그
        added_level = request.POST.get('tagLevel') # 선택 된 레벨
        added_tag = Tag.objects.get(name=added_preferLanguage)

        if(request.POST.get('action') == 'append'): # 사용언어/기술스택 추가 버튼 눌렀을 경우
            try:
                already_ints = AccountInterest.objects.get(account=user_account, tag=added_tag)
                already_ints.delete()
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=added_level)
            except:
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=added_level)

        elif(request.POST.get('action') == 'save'): # 저장 버튼 눌렀을 경우
            if info_form.is_valid():
                print('Info is valid form')
            
                info_form.save()

            # 이미지의 용량을 제한 해야함
            pre_img = user_account.photo.path
            img_form = ProfileImgUploadForm(request.POST, request.FILES, instance=user_account)
            if img_form.is_valid():
                if 'photo' in request.FILES: # 폼애 이미지가 있으면
                    try:
                        os.remove(pre_img) # 기존 이미지 삭제
                    except:                # 기존 이미지가 없을 경우에 pass
                        pass

                print('Image is valid form')
                img_form.save()

            port_form = PortfolioUploadForm(request.POST, request.FILES, instance=user_account)
            if port_form.is_valid():
                print('Portfolio is valid form')
                port_form.save()
            
            if info_form.is_valid() and img_form.is_valid() and port_form.is_valid(): # 저장 성공시 메세지
                messages.add_message(request, messages.SUCCESS, '프로필이 성공적으로 저장되었습니다!')

        elif(request.POST.get('action').split(maxsplit=1)[0] == 'delete'):
            delete_requested_tagname = request.POST.get('action').split(maxsplit=1)[1]
            delete_requested_tag = Tag.objects.get(name=delete_requested_tagname)
            tag_deleted = AccountInterest.objects.get(account=user_account, tag=delete_requested_tag).delete()
            print("Selected tag is successfully deleted")

        return redirect(f'/user/{username}/profile-edit/')

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        
        username = context['username']
        user = User.objects.get(username=username)
        student_account = Account.objects.get(user=user.id)
        student_id = student_account.student_data.id
        student_info = StudentTab.objects.get(id=student_id)
        
        # developing....
        tags_all = Tag.objects
        tags_lang = tags_all.filter(type='language').values('name')
        ints = AccountInterest.objects.filter(account=student_account)
        # developing....


        info_form = ProfileInfoUploadForm()
        img_form = ProfileImgUploadForm()
        port_form = PortfolioUploadForm()

        form = {
            'info_form': info_form,
            'img_form': img_form,
            'port_form': port_form
        }
        data = {
            'account': student_account,
            'form': form,
            'info': student_info,
            'ints': ints,
            'tags_lang' : tags_lang
        }
        return render(request, 'profile/profile-edit.html', {'data': data})

    def get_context_data(self, request, *args, **kwargs):
        
        context = super().get_context_data(**kwargs)
        return context

def student_id_to_username(request, student_id):
    username = Account.objects.get(student_data=student_id).user.username
    return redirect(f'/user/{username}/')
