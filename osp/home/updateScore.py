import math
from django.db import connections, transaction, DatabaseError
from django.db.models import Q, F, Value, Sum, Count
from django.db.models.functions import Concat

from user.models import Account, GithubScore, GitHubScoreTable
from repository.models import GithubRepoCommits, GithubIssues, GithubPulls, GithubRepoStats

def user_score_update(user: Account, year: int):
    # try:
        # cursor = connection.cursor()
    github_id = user.student_data.github_id
    pri_email = user.student_data.primary_email
    sec_email = user.student_data.secondary_email
    plural_major = user.student_data.plural_major
    absence = user.student_data.absence
    dept = user.student_data.dept
    github_score = GithubScore.objects.filter(
        yid=f'{year}{github_id}'
    )
    if len(github_score):
        github_score = github_score[0]
    else:
        github_score = GithubScore.objects.create(\
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
    #
    commit_data = GithubRepoCommits.objects.filter(
        (Q(author_github=github_id) | Q(author=pri_email) | Q(author=sec_email)) \
        & (Q(author_date__year__gte=year) & Q(author_date__year__lte=year))
    )
    issue_data = GithubIssues.objects.filter(
        Q(github_id=github_id) & Q(date__year__gte=year) & Q(date__year__lte=year)
    )    
    pull_data = GithubPulls.objects.filter(
        Q(github_id=github_id) & Q(date__year__gte=year) & Q(date__year__lte=year)
    )    
    contr_repos = set(commit_data.values_list('github_id', 'repo_name'))
    contr_repos = contr_repos.union(set(issue_data.values_list('owner_id', 'repo_name')))
    contr_repos = contr_repos.union(set(pull_data.values_list('owner_id', 'repo_name')))
    contr_repos = [f'{x[0]}/{x[1]}' for x in contr_repos]
    contr_repos = GithubRepoStats.objects.all().annotate(
        repo=Concat(F('github_id'), Value('/'), F('repo_name'))
    ).filter(repo__in=contr_repos)
    my_contr_repos = contr_repos.filter(github_id=github_id)
    star_cnt = my_contr_repos.aggregate(total_star=Sum('stargazers_count'))['total_star']
    if star_cnt is None :
        star_cnt = 0
    fork_cnt = my_contr_repos.aggregate(total_fork=Sum('forks_count'))['total_fork']
    if fork_cnt is None :
        fork_cnt = 0
    
    repo_score = {}
    commit_lines = 0
    for repo in contr_repos:
        repo_string = f'{repo.github_id}/{repo.repo_name}'
        repo_score[repo_string] = {}
        repo_stat_data = commit_data.filter(
            github_id=repo.github_id, 
            repo_name=repo.repo_name
        ).aggregate(
            commit_lines=Sum('additions')+Sum('deletions'),
            commit_cnt=Count('sha')
        )
        if repo_stat_data['commit_lines'] is None:
            repo_stat_data['commit_lines'] = 0
        if repo_stat_data['commit_cnt'] is None:
            repo_stat_data['commit_cnt'] = 0
        commit_lines += repo_stat_data['commit_lines']
        repo_score[repo_string]['commit_line_score'] = min(repo_stat_data['commit_lines']/10000, 1)
        repo_score[repo_string]['commit_cnt_score'] = min(repo_stat_data['commit_cnt']/50, 1)
        pull_n_issue = len(issue_data.filter(owner_id=repo.github_id, repo_name=repo.repo_name))
        pull_n_issue += len(pull_data.filter(owner_id=repo.github_id, repo_name=repo.repo_name))
        repo_score[repo_string]['pull_n_issue_score'] = min(pull_n_issue * 0.1, 0.7)
        repo_score[repo_string]['guideline'] = 0.3 if (repo.readme and repo.license and repo.proj_short_desc) else 0
        repo_score[repo_string]['score'] = sum([x for _, x in repo_score[repo_string].items()])
    sorted_score = sorted(repo_score.items(), key=(lambda x: x[1]['score']), reverse=True)
    
    contr_big_repos = contr_repos.filter(
        stargazers_count__gt=50,
        forks_count__gt=50,
        contributors_count__gt=10
    )
    
    big_pull_n_issue = 0
    for repo in contr_big_repos:
        big_pull_n_issue += len(issue_data.filter(owner_id=repo.github_id, repo_name=repo.repo_name))
        big_pull_n_issue += len(pull_data.filter(owner_id=repo.github_id, repo_name=repo.repo_name))
    
    try:
        with transaction.atomic():
            if len(sorted_score) > 0:
                github_score.best_repo = sorted_score[0][0]
                github_score.repo_score_sum = sorted_score[0][1]['score']
                if len(sorted_score) > 1:
                    github_score.score_other_repo_sum = sorted_score[1][1]['score']
                if len(sorted_score) > 2:
                    github_score.score_other_repo_sum += sorted_score[2][1]['score']
                github_score.score_other_repo_sum = min(github_score.score_other_repo_sum, 1.0)
                github_score.score_star = min(math.log10(max((star_cnt + 1.1) / 3, 1)), 2)
                github_score.score_fork = min(fork_cnt * 0.1, 1.0)
                github_score.score_pr_issue = min(big_pull_n_issue * 0.1, 1)
            github_score.save()
            score_table = GitHubScoreTable.objects.filter(
                id=user.student_data.id, 
                year=year
            )
            if len(score_table) > 0:
                score_table = score_table[0]
            else:
                score_table = GitHubScoreTable.objects.create(
                    id=user.student_data.id,
                    year=year,
                    name=user.student_data.name,
                    github_id=github_id,
                    total_score=min(
                        github_score.repo_score_sum + github_score.score_other_repo_sum \
                        + github_score.score_star + github_score.score_fork + github_score.score_pr_issue,
                        5.0
                    ),
                    commit_cnt=0,
                    commit_line=0,
                    issue_cnt=0,
                    pr_cnt=0,
                    repo_cnt=0,
                    dept=dept,
                    absence=absence,
                    plural_major=plural_major
                )
            score_table.total_score=min(
                github_score.repo_score_sum + github_score.score_other_repo_sum \
                + github_score.score_star + github_score.score_fork,
                5.0
            )
            score_table.dept = dept
            score_table.absence = absence
            score_table.plural_major = plural_major
            score_table.commit_cnt=len(commit_data)
            score_table.commit_line=commit_lines
            score_table.issue_cnt=len(issue_data)
            score_table.pr_cnt=len(pull_data)
            score_table.repo_cnt=len(contr_repos)
            score_table.save()
    except DatabaseError as e:
        print(year, user, 'ERROR')
        print(e)
        pass