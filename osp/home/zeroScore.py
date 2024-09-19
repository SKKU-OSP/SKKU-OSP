import math

from django.db import DatabaseError, transaction
from django.db.models import Count, F, Q, Sum, Value
from django.db.models.functions import Concat

from user.models import Account, GithubScore, GitHubScoreTable

def zero_score_update(user: Account, year: int):
    github_id = user.student_data.github_id
    pri_email = user.student_data.primary_email
    sec_email = user.student_data.secondary_email
    personal_email = user.student_data.personal_email
    github_score = GithubScore.objects.filter(
        yid=f'{year}{github_id}'
    )
    print(github_score)
    if len(github_score):
        github_score = github_score[0]
    else:
        github_score = GithubScore.objects.create(
            yid=f'{year}{github_id}',
            github_id=github_id,
            year=year,
            excellent_contributor=0,
            best_repo='',
            guideline_score=0.0,
            code_score=0.0,
            other_project_score=0.0,
            contributor_score=0.0,
            star_score=0.0,
            contribution_score=0.0,
            star_count=0,
            commit_count=0,
            pr_count=0,
            issue_count=0,
            star_owner_count=0,
            fork_owner_count=0,
            score_10000L_sub=0.0,
            score_10000L_add=0.0,
            score_10000L_sum=0.0,
            score_50C=0.0,
            score_pr_issue=0.0,
            guideline_score_v2=0.0,
            repo_score_sub=0.0,
            repo_score_add=0.0,
            repo_score_sum=0.0,
            score_star=0.0,
            score_fork=0.0,
            score_other_repo_sub=0.0,
            score_other_repo_add=0.0,
            score_other_repo_sum=0.0,
            additional_score_sub=0.0,
            additional_score_add=0.0,
            additional_score_sum=0.0,
        )
    score_table = GitHubScoreTable.objects.filter(
        id=user.student_data.id,
        year=year
    )
    print(score_table)
    if len(score_table) > 0:
        score_table = score_table[0]
    else:
        score_table = GitHubScoreTable.objects.create(
            id=user.student_data.id,
            year=year,
            name=user.student_data.name,
            github_id=github_id,
            total_score=0,
            commit_cnt=0,
            commit_line=0,
            issue_cnt=0,
            pr_cnt=0,
            repo_cnt=0,
            dept=user.student_data.dept,
            absence=user.student_data.absence,
            plural_major=user.student_data.plural_major,
            personal_email=personal_email
        )
    print("zeroScore.py")