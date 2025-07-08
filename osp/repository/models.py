from django.db import models


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


class GithubRepoContributor(models.Model):
    github_id = models.CharField(primary_key=True, max_length=40)
    owner_id = models.CharField(max_length=40)
    repo_name = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'github_repo_contributor'
        unique_together = (('github_id', 'repo_name', 'owner_id'),)


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

    def get_guideline(self):
        return {
            "owner_id": self.github_id,
            "repo_name": self.repo_name,
            "create_date": self.create_date,
            "update_date": self.update_date,
            "contributors_count": self.contributors_count,
            "release_ver": self.release_ver,
            "release_count": self.release_count,
            "readme": self.readme,
            "license": self.license,
            "proj_short_desc": self.proj_short_desc,
            "star_count": self.stargazers_count,
            "commit_count": self.commits_count,
            "watcher_count": self.watchers_count,
            "fork_count": self.forks_count,
            "pr_count": self.prs_count,
            "open_issue_count": self.open_issue_count,
            "close_issue_count": self.close_issue_count,
            "dependency_count": self.dependencies
        }

    def get_factors(self):
        return {
            "owner_id": self.github_id,
            "repo_name": self.repo_name,
            "star_count": self.stargazers_count,
            "commit_count": self.commits_count,
            "pr_count": self.prs_count,
            "issue_count": (self.open_issue_count or 0) + (self.close_issue_count or 0),
        }

    def __str__(self):
        return f'{self.github_id}/{self.repo_name}'


class GithubIssues(models.Model):
    owner_id = models.CharField(primary_key=True, max_length=40)
    repo_name = models.CharField(max_length=100)
    number = models.IntegerField()
    github_id = models.CharField(max_length=40)
    title = models.CharField(max_length=256)
    date = models.DateField()

    class Meta:
        managed = False
        db_table = 'github_issues'
        unique_together = (('owner_id', 'repo_name', 'number'),)


class GithubPulls(models.Model):
    owner_id = models.CharField(primary_key=True, max_length=40)
    repo_name = models.CharField(max_length=100)
    number = models.IntegerField()
    github_id = models.CharField(max_length=40)
    title = models.CharField(max_length=256)
    date = models.DateField()

    class Meta:
        managed = False
        db_table = 'github_pulls'
        unique_together = (('owner_id', 'repo_name', 'number'),)


class GithubStars(models.Model):
    id = models.AutoField(primary_key=True)
    owner_id = models.CharField(max_length=40)
    repo_name = models.CharField(max_length=100)
    github_id = models.CharField(max_length=40)
    stargazer = models.CharField(max_length=40)
    date = models.DateField()

    class Meta:
        db_table = 'github_stars'
        unique_together = (('owner_id', 'repo_name', 'stargazer'),)

class GithubRepoStatsyymm(models.Model):
    github_id = models.CharField(primary_key=True, max_length=40)
    repo_name = models.CharField(max_length=100)
    start_yymm = models.DateField()
    end_yymm = models.DateField()
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
        db_table = 'github_repo_stats_yymm'
        unique_together = (('github_id', 'repo_name'),)

class GithubRepoCommitFiles(models.Model):
    github_id = models.CharField(max_length=40, primary_key=True)
    repo_name = models.CharField(max_length=100)
    sha = models.CharField(max_length=256)
    filename = models.CharField(max_length=256)
    status = models.CharField(max_length=40)
    additions = models.IntegerField()
    deletions = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'github_repo_commit_files'
        unique_together = (('github_id', 'repo_name', 'sha'),)


class TestGithubRepository(models.Model):
    id = models.AutoField(primary_key=True)
    owner_name = models.CharField(max_length=100)
    repo_name = models.CharField(max_length=100)
    github_id = models.CharField(max_length=40)
    stars = models.IntegerField(default=0)
    watchers = models.IntegerField(default=0)
    forks = models.IntegerField(default=0)
    commits = models.IntegerField(default=0)
    commit_del = models.IntegerField(default=0)
    commit_add = models.IntegerField(default=0)
    commit_line = models.IntegerField(default=0)
    pr = models.IntegerField(default=0)
    open_issues = models.IntegerField(default=0)
    closed_issues = models.IntegerField(default=0)
    dependencies = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    readme = models.BooleanField(default=False)
    license = models.CharField(max_length=100, blank=True, null=True)
    commit_date = models.DateTimeField(blank=True, null=True)
    updated_date = models.DateTimeField(blank=True, null=True)
    created_date = models.DateTimeField(blank=True, null=True)
    contributors = models.IntegerField(default=0)
    is_private = models.BooleanField(default=False)

    class Meta:
        db_table = 'test_github_repository'
        constraints = [
            models.UniqueConstraint(
                fields=['owner_name', 'repo_name', 'github_id'],
                name='unique_owner_repo_github_id'
            )
        ]
        
    def __str__(self):
        return f'{self.github_id}/{self.owner_name}/{self.repo_name}'
        
    

class TestGithubPullRequest(models.Model):
    id = models.AutoField(primary_key=True) # pr에 부여되는 고유 번호 (api를 통해 확인 가능)
    repo_owner_id = models.CharField(max_length=40, null=False, blank=False)
    repo_name = models.CharField(max_length=100, null=False, blank=False)
    pr_number = models.IntegerField(null=False, blank=False)
    author_name = models.CharField(max_length=40, null=False, blank=False)
    pr_title = models.CharField(max_length=256)
    pr_date = models.DateField()

    class Meta:
        db_table = 'test_github_pull_request'

    def __str__(self):
        return f'{self.author_name}/{self.repo_owner_id}/{self.repo_name}/{self.pr_number}'