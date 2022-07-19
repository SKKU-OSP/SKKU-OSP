from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.models import User
from django.contrib import messages
from django.views.generic import TemplateView
from django.views.decorators.csrf import csrf_exempt
from user.models import ScoreTable, StudentTab, GithubScore, Account, AccountInterest, GithubStatsYymm
from home.models import AnnualOverview, AnnualTotal, DistFactor, DistScore, Repository, Student
from tag.models import Tag
from django.contrib.auth.decorators import login_required
from repository.models import GithubRepoStats, GithubRepoContributor, GithubRepoCommits, GithubIssues, GithubPulls

from django.core.files.images import get_image_dimensions

from user.forms import ProfileInfoUploadForm, ProfileImgUploadForm, PortfolioUploadForm, IntroductionUploadForm
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

        user = User.objects.get(username=context['account'])

        tags_all = Tag.objects
        tags_domain = tags_all.filter(type='domain')
        # 관심 목록 리스트
        
        # 관심분야
        student_account = Account.objects.get(user=user.id)
        ints = AccountInterest.objects.filter(account=student_account).filter(tag__in=tags_domain)
        # 사용언어, 기술스택
        lang = AccountInterest.objects.filter(account=student_account).exclude(tag__in=tags_domain)
        data = {
            'info': student_info,
            'score': student_score,
            'repos': recent_repos,
            'ints': ints,
            'lang': lang,
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
        star_sum = 0
        for row in star_data:
            star_sum += row["star"]
            if row["github_id"] == github_id:
                own_star["star"] = row["star"]
        own_star["avg"] = star_sum/len(star_data)
        
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
            monthly_avg.append([])
        for avg in total_avg_queryset:
            yid = avg["start_yymm"].year - self.start_year
            if yid >= 0 :
                avg["year"] = avg["start_yymm"].year
                avg["month"] =  avg["start_yymm"].month
                avg.pop('start_yymm', None)
                monthly_avg[yid].append(avg)
        chartdata["monthly_contr"] = monthly_contr
        chartdata["own_star"] = own_star
        chartdata["monthly_avg"] = monthly_avg
        chartdata["username"] = github_id
        context["chart_data"] = json.dumps(chartdata)
        context["this_year"] = self.end_year
        context["star"] = own_star["star"]
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


        print(request.POST.get("action"))

        if(request.POST.get('action') == 'append_ints'): # 관심분야 추가 버튼 눌렀을 경우
            added_preferLanguage = request.POST.get('interestDomain') # 선택 된 태그
            added_tag = Tag.objects.get(name=added_preferLanguage)
            try:
                already_ints = AccountInterest.objects.get(account=user_account, tag=added_tag)
                already_ints.delete()
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=0)
            except:
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=0)

        elif(request.POST.get('action') == 'append_lang'): # 사용언어/기술스택 추가 버튼 눌렀을 경우
            added_preferLanguage = request.POST.get('preferLanguage') # 선택 된 태그
            added_level = request.POST.get('tagLevel') # 선택 된 레벨
            added_tag = Tag.objects.get(name=added_preferLanguage)
            try:
                already_ints = AccountInterest.objects.get(account=user_account, tag=added_tag)
                already_ints.delete()
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=added_level)
            except:
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=added_level)

        elif(request.POST.get('action') == 'save'): # 저장 버튼 눌렀을 경우
            # 기본정보 폼
            info_form = ProfileInfoUploadForm(request.POST, request.FILES, instance=user_tab)
            if info_form.is_valid():
                print('Info is valid form')
            
                info_form.save()

            # 소개 폼
            intro_form = IntroductionUploadForm(request.POST, request.FILES, instance=user_account)
            if intro_form.is_valid():
                print('Intro is valid form')
            
                intro_form.save()



            # 프로필 사진 폼
            pre_img = user_account.photo.path
            field_check_list = {}
            profile_img = request.FILES.get('photo', False)
            is_valid = True
            if profile_img:
                img_width, img_height = get_image_dimensions(profile_img)
                if img_width > 500 or img_height > 500:
                    is_valid = False
                    field_check_list['photo'] = f'이미지 크기는 500px x 500px 이하입니다. 현재 {img_width}px X {img_height}px'

            img_form = ProfileImgUploadForm(request.POST, request.FILES, instance=user_account)
            if bool(img_form.is_valid()) and is_valid:
                if 'photo' in request.FILES: # 폼에 이미지가 있으면
                    try:
                        os.remove(pre_img) # 기존 이미지 삭제
                    except:                # 기존 이미지가 없을 경우에 pass
                        pass

                print('Image is valid form')
                img_form.save()

            else:
                print(field_check_list['photo'])


            port_form = PortfolioUploadForm(request.POST, request.FILES, instance=user_account)
            if port_form.is_valid():
                print('Portfolio is valid form')
                port_form.save()
            
            if info_form.is_valid() and img_form.is_valid() and port_form.is_valid(): # 저장 성공시 메세지
                messages.add_message(request, messages.SUCCESS, '프로필이 성공적으로 저장되었습니다!')

        else:
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
        tags_domain = tags_all.filter(type='domain')
        ints = AccountInterest.objects.filter(account=student_account).filter(tag__in=tags_domain)
        lang = AccountInterest.objects.filter(account=student_account).exclude(tag__in=tags_domain)
        # developing....


        info_form = ProfileInfoUploadForm()
        img_form = ProfileImgUploadForm()
        port_form = PortfolioUploadForm()
        intro_form = IntroductionUploadForm()

        form = {
            'info_form': info_form,
            'img_form': img_form,
            'port_form': port_form,
            'intro_form': intro_form
        }
        data = {
            'account': student_account,
            'form': form,
            'info': student_info,
            'ints': ints,
            'tags_lang' : lang
        }

        if(str(request.user) != username): # 타인이 edit페이지 접속 시도시 프로필 페이지로 돌려보냄
            print("허용되지 않는 접근 입니다.")
            return redirect(f'/user/{username}/')

        return render(request, 'profile/profile-edit.html', {'data': data})

    def get_context_data(self, request, *args, **kwargs):
        
        context = super().get_context_data(**kwargs)
        return context

def student_id_to_username(request, student_id):
    username = Account.objects.get(student_data=student_id).user.username
    return redirect(f'/user/{username}/')


@csrf_exempt
def compare_stat(request, username):
    if request.method == 'POST':
        end_year = 2021
        start_year = 2019
        data = json.loads(request.body)
        #data에는 github_id 가 들어있어야한다.
        github_id = data["github_id"]
        own_star = 0
        try:
            star_data = GithubRepoStats.objects.filter(github_id=github_id).extra(tables=['github_repo_contributor'], where=["github_repo_contributor.repo_name=github_repo_stats.repo_name", "github_repo_contributor.owner_id=github_repo_stats.github_id", "github_repo_stats.github_id = github_repo_contributor.github_id"]).values('github_id').annotate(star=Sum("stargazers_count"))
            for sd in star_data:
                own_star = sd['star']
        except Exception as e:
            print(e)
        
        monthly_contr = [ [] for i in range(end_year-start_year+1)]
        gitstat_year = GithubStatsYymm.objects.filter(github_id=github_id)
        for row in gitstat_year:
            row_json = row.to_json()
            row_json['star'] = own_star
            if row_json["year"] >= start_year :
                monthly_contr[row_json["year"]-start_year].append(row_json)
                
        context = {
            "monthly_contr":monthly_contr,
            "github_id":github_id,
        }
        
        return JsonResponse(context)
    
    
class ProfileRepoView(TemplateView):
    
    template_name = 'profile/repo.html'
    def get_context_data(self, *args, **kwargs):
        
        start = time.time()
        context = super().get_context_data(**kwargs)
        
        user = User.objects.get(username=context["username"])
        account = Account.objects.get(user=user)
        student_data = account.student_data
        github_id = student_data.github_id
        context['account'] = github_id
        repo_commits = GithubRepoCommits.objects.filter(committer_github=github_id).values("github_id", "repo_name", "committer_date").order_by("-committer_date")
        repos = {}
        id_reponame_pair_list = []
        for commit in repo_commits:
            commit_repo_name = commit['repo_name']
            if commit_repo_name not in repos:
                repos[commit_repo_name] = {'repo_name': commit_repo_name}
                repos[commit_repo_name]['github_id'] = commit['github_id']
                repos[commit_repo_name]['committer_date'] = commit['committer_date']
                id_reponame_pair_list.append((commit['github_id'], commit_repo_name))
        ctx_repo_stats = []
        contr_repo_queryset = GithubRepoStats.objects.extra(where=["(github_id, repo_name) in %s"], params=[tuple(id_reponame_pair_list)])
        for contr_repo in contr_repo_queryset:
            repo_stat = contr_repo.get_guideline()
            repo_stat['committer_date'] = repos[contr_repo.repo_name]['committer_date'] 
            ctx_repo_stats.append(repo_stat)
        ctx_repo_stats = sorted(ctx_repo_stats, key=lambda x:x['committer_date'], reverse=True)
        context["guideline"] = ctx_repo_stats
        
        print("\nProfileRepoView time :", time.time() - start)
        
        return context
