from rest_framework import serializers
from repository import models


class GithubRepoContributorSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.GithubRepoContributor
        fields = (
            "github_id",
            "owner_id",
            "repo_name"
        )


class GithubRepoStatsSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.GithubRepoStats
        fields = (
            "github_id",
            "repo_name",
            "stargazers_count",
            "forks_count",
            "commits_count",
            "prs_count",
            "open_issue_count",
            "close_issue_count",
            "watchers_count",
            "dependencies",
            "language",
            "create_date",
            "update_date",
            "contributors_count",
            "release_ver",
            "release_count",
            "readme",
            "license",
            "proj_short_desc",
        )
