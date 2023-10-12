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
            "issue_count": self.open_issue_count + self.close_issue_count,
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
