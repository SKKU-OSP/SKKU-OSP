from django.http import JsonResponse
from django.shortcuts import render
from django.views.generic import TemplateView
from user.models import ScoreTable, StudentTab
from django.contrib.auth.decorators import login_required
from repository.models import GithubRepoStats, GithubRepoContributor, GithubRepoCommits, GithubIssues, GithubPulls


# Create your views here.



class ProfileView(TemplateView):

    def get(self, request, *args, **kwargs):

        context = self.get_context_data(request, *args, **kwargs)
        print(context)
        # std = StudentTab.objects.filter(id=student_id)

        # # 화면 에러 처리
        # if std.count() < 1:
        #     context['std'] = None

        # # 정보를 가져옴.
        # else:
        #     # student info
        #     context['std'] = std.get()
        #     github_id = context['std'].github_id
        #     # student score info
        #     score = ScoreTable.objects.filter(name=github_id).filter(year=2021)
        #     if score:
        #         context['score'] = score.first().total_score
        #     # student repository info
        #     context['cur_repo_type'] = 'owned'
        #     ## owned repository
        #     context['repos'] = get_repos(context['cur_repo_type'], github_id)
        #     print(context['repos'])

        # return render(request=request, template_name=self.template_name, context=context)
        student_info = StudentTab.objects.get(id=context['username'])
        student_score = ScoreTable.objects.get(id=context['username'], year=2021)
        data = {}
        data['info'] = student_info
        data['score'] = student_score
        
        return render(request, 'profile/profile.html', {'data': data})

    # ajax 요청 시 POST로 처리됨.(owned/ contributed repository Tab)
    # def post(self, request, *args, **kwargs):
    #     context = self.get_context_data(request, *args, **kwargs)
    #     # POST 요청 시 예외 처리 안함.
    #     std = self.POST.get('student_id')
    #     context['std'] = std

    #     github_id = StudentTab.objects.first(id=std.id).github_id

    #     context['cur_repo_type'] = self.POST.get('cur_repo_type')
    #     context['repos'] = get_repos(context['cur_repo_type'], github_id)


    def get_context_data(self, request, *args, **kwargs):
        
        context = super().get_context_data(**kwargs)

        return context

class ProfileEditView(TemplateView):

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)

        student_info = StudentTab.objects.get(id=context['username'])
        data = {}
        data['info'] = student_info

        return render(request, 'profile/profile-edit.html', {'data': data})

    def get_context_data(self, request, *args, **kwargs):
        
        context = super().get_context_data(**kwargs)
        return context

