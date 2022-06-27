from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class StudentTab(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=20)
    college = models.CharField(max_length=45)
    dept = models.CharField(max_length=45)
    github_id = models.CharField(max_length=40)
    absence = models.IntegerField()
    plural_major = models.IntegerField()
    personal_email = models.CharField(max_length=100)
    primary_email = models.CharField(max_length=100)
    secondary_email = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'student_tab'
        ordering  = ['id']


class GithubOverview(models.Model):
    github_id = models.CharField(primary_key=True, max_length=40)
    stars = models.IntegerField()
    followers = models.IntegerField()
    followings = models.IntegerField()
    total_repos = models.IntegerField()
    total_commits = models.IntegerField()
    total_prs = models.CharField(db_column='total_PRs', max_length=45)  # Field name made lowercase.
    total_issues = models.CharField(max_length=45)
    achievements = models.CharField(max_length=200, blank=True, null=True)
    highlights = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'github_overview'


class GithubStatsYymm(models.Model):
    github_id = models.CharField(primary_key=True, max_length=40)
    start_yymm = models.DateField()
    end_yymm = models.DateField()
    stars = models.IntegerField()
    num_of_cr_repos = models.IntegerField()
    num_of_co_repos = models.IntegerField()
    num_of_commits = models.IntegerField()
    num_of_prs = models.IntegerField(db_column='num_of_PRs')  # Field name made lowercase.
    num_of_issues = models.IntegerField()
    
class ScoreTable(models.Model):
    id = models.IntegerField(primary_key=True)
    year = models.IntegerField()
    name = models.CharField(max_length=20)
    github_id = models.CharField(max_length=40)
    total_score = models.FloatField()
    commit_cnt = models.IntegerField()
    commit_line = models.IntegerField()
    issue_cnt = models.IntegerField()
    pr_cnt = models.IntegerField()
    repo_cnt = models.IntegerField()
    dept = models.CharField(max_length=45)
    absence = models.IntegerField()
    plural_major = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'score_table_sum'
        unique_together = (('id', 'year'),)

class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    student_data = models.OneToOneField(StudentTab, on_delete=models.CASCADE)
    class Meta:
        ordering  = ['student_data']


class GithubRepoCommits(models.Model):
    github_id = models.CharField(primary_key=True, max_length=40)
    repo_name = models.CharField(max_length=100)
    sha = models.CharField(max_length=40)
    additions = models.IntegerField()
    deletions = models.IntegerField()
    author_date = models.DateTimeField()
    committer_date = models.DateTimeField()
    author = models.CharField(max_length=100, blank=True, null=True)
    committer = models.CharField(max_length=100, blank=True, null=True)
    author_github = models.CharField(max_length=50, blank=True, null=True)
    committer_github = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'github_repo_commits'
        unique_together = (('github_id', 'repo_name', 'sha'),)





class GithubRepoStats(models.Model):
    github_id = models.CharField(primary_key=True, max_length=40)
    repo_name = models.CharField(max_length=100)
    stargazers_count = models.IntegerField(blank=True, null=True)
    forks_count = models.IntegerField(blank=True, null=True)
    commits_count = models.IntegerField(blank=True, null=True)
    prs_count = models.IntegerField(blank=True, null=True)
    open_issue_count = models.IntegerField(blank=True, null=True)
    close_issue_count = models.IntegerField(blank=True, null=True)
    watchers_count = models.IntegerField(blank=True, null=True)
    dependencies = models.IntegerField(blank=True, null=True)
    language = models.CharField(max_length=45, blank=True, null=True)
    create_date = models.DateTimeField(blank=True, null=True)
    update_date = models.DateTimeField(blank=True, null=True)
    contributors_count = models.IntegerField(blank=True, null=True)
    release_ver = models.CharField(max_length=45, blank=True, null=True)
    release_count = models.IntegerField(blank=True, null=True)
    readme = models.IntegerField(blank=True, null=True)
    license = models.CharField(max_length=45, blank=True, null=True)
    proj_short_desc = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'github_repo_stats'
        unique_together = (('github_id', 'repo_name'),)