from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.models import User
from django.contrib import messages
from django.views.generic import TemplateView
from django.views.decorators.csrf import csrf_exempt
from user.models import ScoreTable, StudentTab, GithubScore, Account, AccountInterest, GithubStatsYymm
from home.models import AnnualOverview, AnnualTotal, DistFactor, DistScore, Repository, Student
from tag.models import Tag, DomainLayer
from django.contrib.auth.decorators import login_required
from repository.models import GithubRepoStats, GithubRepoContributor, GithubRepoCommits, GithubIssues, GithubPulls

from django.core.files.images import get_image_dimensions

from user.forms import ProfileInfoUploadForm, ProfileImgUploadForm, PortfolioUploadForm, IntroductionUploadForm, LanguageForm
from django.db.models import Avg, Sum, Subquery

import time
import json
import os
import math

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
        id_reponame_pair_list = []
        # 최근 기여 리포지토리 목록 중, 중복하지 않는 가장 최근 4개의 리포지토리 목록을 셍성함
        for commit in commit_repos:
            commit_repo_name = commit['repo_name']
            if len(recent_repos) == 3:
                break
            if commit_repo_name not in recent_repos:
                recent_repos[commit_repo_name] = {'repo_name': commit_repo_name}
                recent_repos[commit_repo_name]['github_id'] = commit['github_id']
                recent_repos[commit_repo_name]['committer_date'] = commit['committer_date']
                id_reponame_pair_list.append((commit['github_id'], commit_repo_name))
        contr_repo_queryset = GithubRepoStats.objects.extra(where=["(github_id, repo_name) in %s"], params=[tuple(id_reponame_pair_list)])
        for contr_repo in contr_repo_queryset:
            recent_repos[contr_repo.repo_name]["desc"] = contr_repo.proj_short_desc
        recent_repos = sorted(recent_repos.values(), key=lambda x:x['committer_date'], reverse=True)

        tags_all = Tag.objects # 태그 전체
        tags_domain = tags_all.filter(type='domain') # 분야 태그

        # 유저의 관심분야
        student_account = context['account'] 

        ints = AccountInterest.objects.filter(account=student_account).filter(tag__in=tags_domain)

        # 유저의 사용언어, 기술스택
        lang_tags = Tag.objects.filter(name__in = AccountInterest.objects.filter(account=student_account).exclude(tag__type="domain").values("tag")).order_by("name")
        account_lang = AccountInterest.objects.filter(account=student_account, tag__in=lang_tags).exclude(tag__type="domain").order_by("tag__name")
        level_list = []
        for al in account_lang:
            level_list.append(al.level)
        lang = []
        for tag in lang_tags:
            lang_tag_dict = {}
            lang_tag_dict["name"] = tag.name
            lang_tag_dict["type"] = tag.type
            lang_tag_dict["level"] = level_list[len(lang)]
            lang.append(lang_tag_dict)
        domain_layer = DomainLayer.objects
        
        ints_parent_layer = domain_layer.filter(parent_tag__in=ints.values('tag')).values('parent_tag').order_by('parent_tag').distinct()
        ints_child_layer = domain_layer.filter(child_tag__in=ints.values('tag')).values('child_tag').order_by('child_tag').distinct()
        relation_origin = domain_layer.values('parent_tag', 'child_tag')


        relations = []
        remain_children = list(ints_child_layer)
        print(remain_children)
        for par in ints_parent_layer:
            relation = {
                'parent' :'',
                'children' : [],
            }
            relation['parent'] = par['parent_tag']
            for chi in ints_child_layer:
                if {'parent_tag':par['parent_tag'],'child_tag':chi['child_tag']} in relation_origin:
                    print('It is True')
                    relation['children'].append(chi['child_tag'])
                    remain_children.remove({'child_tag' : chi['child_tag']})
            relations.append(relation)

        print(relations)
        print(remain_children)
        data = {
            'info': student_info,
            'score': student_score,
            'repos': recent_repos,
            'ints': ints,
            'lang': lang,
            'relations': relations,
            'remains': remain_children,
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
        context["user_type"] = 'user'
        context["student_id"] = student_data.id
        student = StudentTab.objects.all()
        star_data = GithubRepoStats.objects.filter(github_id__in=Subquery(student.values('github_id'))).extra(tables=['github_repo_contributor'], where=["github_repo_contributor.repo_name=github_repo_stats.repo_name", "github_repo_contributor.owner_id=github_repo_stats.github_id", "github_repo_stats.github_id = github_repo_contributor.github_id"]).values('github_id').annotate(star=Sum("stargazers_count"))
        
        own_star = {}
        star_temp_dist = []
        for row in star_data:
            star_temp_dist.append(row["star"])
            if row["github_id"] == github_id:
                own_star["star"] = row["star"]
        star_temp_dist.sort()

        mean = sum(star_temp_dist)/len(star_temp_dist)
        own_star["avg"] = mean
        sigma = math.sqrt(sum((val - mean)**2 for val in star_temp_dist)/len(star_temp_dist))
        own_star["std"] = sigma
        star_dist = [star_temp_dist for i in range(self.end_year-self.start_year+1)]
        
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

        score_data_list = []
        score_detail_data = GithubScore.objects.filter(github_id=github_id)
        
        for row in score_detail_data:
            score_data_list.append(row.to_json())
        chartdata["score_data"] = score_data_list
        
        score_data = ScoreTable.objects.all()
        total_factor_data_list = []
        user_data_list = []
        for row in score_data:
            total_factor_data_list.append(row.to_json())
            if row.name == github_id:
                user_data_list.append(row.to_json())
        chartdata["user_data"] = json.dumps(user_data_list)
        score_dist = [[] for i in range(self.end_year-self.start_year+1)]
        commit_dist = [[] for i in range(self.end_year-self.start_year+1)]
        pr_dist = [[] for i in range(self.end_year-self.start_year+1)]
        issue_dist = [[] for i in range(self.end_year-self.start_year+1)]
        repo_dist = [[] for i in range(self.end_year-self.start_year+1)]
        for factor_data in total_factor_data_list:
            if factor_data["year"] >= self.start_year :
                yid = factor_data["year"]-self.start_year
                score_dist[yid].append(factor_data["total_score"])
                commit_dist[yid].append(factor_data["commit_cnt"])
                pr_dist[yid].append(factor_data["pr_cnt"])
                issue_dist[yid].append(factor_data["issue_cnt"])
                repo_dist[yid].append(factor_data["repo_cnt"])
        annual_dist_data = {"score_sum":[], "commit": [], "pr": [], "issue": [], "repo": [], "score_sum_std":[], "commit_std":[], "pr_std":[], "issue_std":[], "repo_std":[]}
        for sub_dist in score_dist:
            sub_dist.sort()
            mean = sum(sub_dist)/len(sub_dist)
            annual_dist_data["score_sum"].append(mean)
            sigma = math.sqrt(sum((val - mean)**2 for val in sub_dist)/len(sub_dist))
            annual_dist_data["score_sum_std"].append(sigma)
        for sub_dist in commit_dist:
            sub_dist.sort()
            mean = sum(sub_dist)/len(sub_dist)
            annual_dist_data["commit"].append(mean)
            sigma = math.sqrt(sum((val - mean)**2 for val in sub_dist)/len(sub_dist))
            annual_dist_data["commit_std"].append(sigma)
        for sub_dist in pr_dist:
            sub_dist.sort()
            mean = sum(sub_dist)/len(sub_dist)
            annual_dist_data["pr"].append(mean)
            sigma = math.sqrt(sum((val - mean)**2 for val in sub_dist)/len(sub_dist))
            annual_dist_data["pr_std"].append(sigma)
        for sub_dist in issue_dist:
            sub_dist.sort()
            mean = sum(sub_dist)/len(sub_dist)
            annual_dist_data["issue"].append(mean)
            sigma = math.sqrt(sum((val - mean)**2 for val in sub_dist)/len(sub_dist))
            annual_dist_data["issue_std"].append(sigma)
        for sub_dist in repo_dist:
            sub_dist.sort()
            mean = sum(sub_dist)/len(sub_dist)
            annual_dist_data["repo"].append(mean)
            sigma = math.sqrt(sum((val - mean)**2 for val in sub_dist)/len(sub_dist))
            annual_dist_data["repo_std"].append(sigma)
        chartdata["annual_overview"] = json.dumps([annual_dist_data])
        chartdata["score_dist"] = score_dist
        chartdata["star_dist"] = star_dist
        chartdata["commit_dist"] = commit_dist
        chartdata["pr_dist"] = pr_dist
        chartdata["issue_dist"] = issue_dist
        chartdata["repo_dist"] = repo_dist
        
        monthly_contr = [ [] for i in range(self.end_year-self.start_year+1)]
        gitstat_year = GithubStatsYymm.objects.filter(github_id=github_id)
        for row in gitstat_year:
            row_json = row.to_json()
            row_json['star'] = own_star["star"]
            if row_json["year"] >= self.start_year :
                monthly_contr[row_json["year"]-self.start_year].append(row_json)
        
        total_avg_queryset = GithubStatsYymm.objects.exclude(num_of_cr_repos=0, num_of_co_repos=0, num_of_commits=0, num_of_prs=0, num_of_issues=0).values('start_yymm').annotate(commit=Avg("num_of_commits"), pr=Avg("num_of_prs"), issue=Avg("num_of_issues"), repo_cr=Avg("num_of_cr_repos"), repo_co=Avg("num_of_co_repos")).order_by('start_yymm')
        
        monthly_avg = [ [] for i in range(self.end_year-self.start_year+1)]
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
        tags_all = Tag.objects
        tags_domain = tags_all.filter(type='domain')

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
            print(request.POST.get('preferLanguage'))
            added_preferLanguage = request.POST.get('preferLanguage') # 선택 된 태그
            added_tag = Tag.objects.get(name=added_preferLanguage)
            try:
                already_ints = AccountInterest.objects.get(account=user_account, tag=added_tag)
            except:
                AccountInterest.objects.create(account=user_account, tag=added_tag, level=1)

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


            # 사용언어 추가
            lang = AccountInterest.objects.filter(account=user_account).exclude(tag__in=tags_domain)
            for l in lang:
                if "tag_" + l.tag.name in request.POST:
                    added_tag = Tag.objects.get(name=l.tag.name)
                    AccountInterest.objects.filter(account=user_account, tag=added_tag).update(level=request.POST.get("tag_" + l.tag.name))

            
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
