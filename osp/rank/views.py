from django.http import JsonResponse
from django.shortcuts import render
from user.models import ScoreTable, StudentTab
from django.contrib.auth.decorators import login_required
from repository.models import GithubRepoStats, GithubRepoContributor, GithubRepoCommits, GithubIssues, GithubPulls

# Create your views here.
@login_required
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

@login_required
def repo_rank(request):
    repo_list = []
    student_contributor = {}
    for x in GithubRepoContributor.objects.all():
        if x.owner_id + '/' + x.repo_name not in student_contributor:
            student_contributor[x.owner_id + '/' + x.repo_name] = []
        student_contributor[x.owner_id + '/' + x.repo_name].append(x)
    for repo in GithubRepoStats.objects.all():
        repo_link = repo.github_id + '/' + repo.repo_name
        if repo_link in student_contributor:
            repo.student_contributor = student_contributor[repo_link]
            repo_list.append(repo)
    return render(request, 'rank/repo_rank.html', {'data': repo_list})

def repo_api(request):
    owner_id = request.GET['github_id']
    repo_name = request.GET['repo_name']
    result = []
    for student in GithubRepoContributor.objects.filter(owner_id=owner_id).filter(repo_name=repo_name):
        student_profile = list(StudentTab.objects.filter(github_id=student.github_id))
        if len(student_profile) != 1:
            continue
        commmit_cnt = len(GithubRepoCommits.objects.filter(
            github_id=owner_id,
            repo_name=repo_name,
            committer_github=student.github_id
        ))
        issue_cnt = len(GithubIssues.objects.filter(
            owner_id=owner_id,
            repo_name=repo_name,
            github_id=student.github_id
        ))
        pull_cnt = len(GithubPulls.objects.filter(
            owner_id=owner_id,
            repo_name=repo_name,
            github_id=student.github_id
        ))
        result.append({
            'name': student_profile[0].name,
            'github_id': student.github_id,
            'commit_cnt': commmit_cnt,
            'issue_cnt': issue_cnt,
            'pull_cnt': pull_cnt
        })
    return JsonResponse(result, safe=False)