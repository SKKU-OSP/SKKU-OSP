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

        student_info = StudentTab.objects.get(id=context['user_id'])
        student_score = ScoreTable.objects.get(id=context['user_id'], year=2021)
        data = {}
        data['info'] = student_info
        data['score'] = student_score
        
        return render(request, 'profile.html', {'data': data})

    def get_context_data(self, request, *args, **kwargs):
        
        context = super().get_context_data(**kwargs)

        return context

class ProfileEditView(TemplateView):

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)

        student_info = StudentTab.objects.get(id=context['user_id'])
        data = {}
        data['info'] = student_info

        return render(request, 'profile-edit.html', {'data': data})

    def get_context_data(self, request, *args, **kwargs):
        
        context = super().get_context_data(**kwargs)
        return context

