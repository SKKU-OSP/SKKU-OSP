from django.shortcuts import render
from django.http import JsonResponse
from user.models import ScoreTable
from repository.models import GithubRepoStats
import traceback

# Create your views here.
def user_rank(request):
    student_list = list(ScoreTable.objects.all())
    return render(request, 'rank/user_rank.html', {'data': student_list})

def repo_rank(request):
    repo_list = list(GithubRepoStats.objects.all())
    return render(request, 'rank/repo_rank.html', {'data': repo_list})   