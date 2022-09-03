from email.policy import default
from django.db import models
from django.contrib.auth.models import User
from tag.models import Tag

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
    
    class Meta:
        managed = False
        db_table = 'github_stats_yymm'
        
    def to_json(self):
        return{
            "year" : self.start_yymm.year,
            "month" : self.start_yymm.month,
            "repo_cr" : self.num_of_cr_repos,
            "repo_co": self.num_of_co_repos,
            "commit" : self.num_of_commits,
            "pr" : self.num_of_prs,
            "issue" : self.num_of_issues,
            "total" : self.stars+self.num_of_cr_repos+self.num_of_co_repos+self.num_of_commits+self.num_of_prs+self.num_of_issues,
        }
        
    
class ScoreTable(models.Model):
    a_id = models.AutoField(primary_key=True)
    id = models.IntegerField()
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
        managed=False
        db_table = 'score_table_sum'
    
    def to_json(self):
        return {
            "id":self.id,
            "year":self.year,
            "name":self.github_id,
            "github_id":self.name,
            "total_score":self.total_score,
            "commit_cnt":self.commit_cnt,
            "commit_line":self.commit_line,
            "issue_cnt":self.issue_cnt,
            "pr_cnt":self.pr_cnt,
            "repo_cnt":self.repo_cnt,
            "dept":self.dept,
            "absence":self.absence,
            "plural_major":self.plural_major,
        }

class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    student_data = models.OneToOneField(StudentTab, on_delete=models.CASCADE, null=True)
    photo = models.ImageField(upload_to='img/profile_img', default='default.jpg')
    introduction = models.TextField(default='')
    portfolio = models.TextField(default='')
    profile_open = models.BooleanField(default=False)
    recommend_open = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f'{self.user.username}'
    
    class Meta:
        ordering  = ['student_data']

class AccountInterest(models.Model):
    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(Account, models.CASCADE)
    tag = models.ForeignKey(Tag, models.CASCADE)
    level = models.IntegerField(default=0)
    
class GithubScore(models.Model):
    yid =models.CharField(max_length=45, null=False, primary_key=True)
    github_id = models.CharField(max_length=45, null=False)
    year = models.IntegerField(null=False)
    excellent_contributor = models.IntegerField(null=False)
    best_repo = models.CharField(max_length=100, null=False)
    guideline_score = models.FloatField(null=False)
    code_score = models.FloatField(null=False)
    other_project_score = models.FloatField(null=False)
    contributor_score = models.FloatField(null=False)
    star_score = models.FloatField(null=False)
    contribution_score = models.FloatField(null=False)
    
    star_count = models.IntegerField(null=False)
    commit_count = models.IntegerField(null=False)
    pr_count = models.IntegerField(null=False)
    issue_count = models.IntegerField(null=False)
    star_owner_count = models.IntegerField(null=False)
    fork_owner_count = models.IntegerField(null=False)
    
    score_10000L_sub = models.FloatField(null=False)
    score_10000L_add = models.FloatField(null=False)
    score_10000L_sum = models.FloatField(null=False)
    score_50C = models.FloatField(null=False)
    score_pr_issue = models.FloatField(null=False)
    
    guideline_score_v2 = models.FloatField(null=False)
    repo_score_sub = models.FloatField(null=False)
    repo_score_add = models.FloatField(null=False)
    repo_score_sum = models.FloatField(null=False)
    
    score_star = models.FloatField(null=False)
    score_fork = models.FloatField(null=False)
    score_other_repo_sub = models.FloatField(null=False)
    score_other_repo_add = models.FloatField(null=False)
    score_other_repo_sum = models.FloatField(null=False)
    
    additional_score_sub = models.FloatField(null=False)
    additional_score_add = models.FloatField(null=False)
    additional_score_sum = models.FloatField(null=False)
    
    
    class Meta:
        managed = False
        db_table = 'github_score'
        
    def to_json(self):
        return {
            "yid": self.yid,
            "github_id":self.github_id,
            "year":self.year,
            "excellent_contributor":self.excellent_contributor,
            "best_repo":self.best_repo,
            "main_repo_score": self.repo_score_sum,
            "other_repo_score": self.score_other_repo_sum,
            "reputation_score": self.score_star+self.score_fork,
            "total_score": self.repo_score_sum + self.score_other_repo_sum + self.score_star+self.score_fork
        }

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


class GithubUserFollowing(models.Model):
    github_id = models.CharField(primary_key=True, max_length=40)
    following_id = models.CharField(max_length=40)

    class Meta:
        managed = False
        db_table = 'github_user_following'
        unique_together = (('github_id', 'following_id'),)


class GithubUserStarred(models.Model):
    github_id = models.CharField(primary_key=True, max_length=40)
    starred_repo_owner = models.CharField(max_length=40)
    starred_repo_name = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'github_user_starred'
        unique_together = (('github_id', 'starred_repo_owner', 'starred_repo_name'),)


class GithubRepoContributor(models.Model):
    github_id = models.CharField(primary_key=True, max_length=40)
    owner_id = models.CharField(max_length=40)
    repo_name = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'github_repo_contributor'
        unique_together = (('github_id', 'repo_name', 'owner_id'),)


class DevType(models.Model):
    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(Account, models.CASCADE)
    # GBTI
    typeA = models.IntegerField()
    typeB = models.IntegerField()
    typeC = models.IntegerField()
    typeD = models.IntegerField()
    # Analysis Type
    typeE = models.IntegerField()
    typeF = models.IntegerField()
    typeG = models.IntegerField()

class GitHubScoreTable(models.Model):
    a_id = models.AutoField(primary_key=True)
    id = models.IntegerField()
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
        constraints = [
            models.UniqueConstraint(
                fields=['id', 'year'],
                name='id_year_constraint'
            )]
    
    def to_json(self):
        return {
            "id":self.id,
            "year":self.year,
            "name":self.github_id,
            "github_id":self.name,
            "total_score":self.total_score,
            "commit_cnt":self.commit_cnt,
            "commit_line":self.commit_line,
            "issue_cnt":self.issue_cnt,
            "pr_cnt":self.pr_cnt,
            "repo_cnt":self.repo_cnt,
            "dept":self.dept,
            "absence":self.absence,
            "plural_major":self.plural_major,
        }