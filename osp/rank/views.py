from django.shortcuts import render
from user.models import ScoreTable
from repository.models import GithubRepoStats
# Create your views here.
def user_rank(request):
    # Split by Year
    score_by_year = {}
    for student in ScoreTable.objects.all():
        if student.year not in score_by_year:
            score_by_year[student.year] = []
        score_by_year[student.year].append(student)
    # Sort each year data
    
    student_list = []
    for year in score_by_year:
        sorted_score_by_year = sorted(score_by_year[year], key=lambda x: x.total_score, reverse=True)
        rank = 1
        for idx, row in enumerate(sorted_score_by_year):
            if idx > 0 and sorted_score_by_year[idx].total_score != sorted_score_by_year[idx - 1].total_score:
                rank += 1
            row.rank = rank
            student_list.append(row)
    return render(request, 'rank/user_rank.html', {'data': student_list})

def repo_rank(request):
    repo_list = list(GithubRepoStats.objects.all())
    return render(request, 'rank/repo_rank.html', {'data': repo_list})   