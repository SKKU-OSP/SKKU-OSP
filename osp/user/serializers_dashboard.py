from rest_framework import serializers
from user import models


class GithubScoreResultSerializer(serializers.ModelSerializer):
    '''
    점수 계산 결과를 위한 시리얼라이저
    '''
    main_repo_score = serializers.SerializerMethodField()
    other_repo_score = serializers.SerializerMethodField()
    reputation_score = serializers.SerializerMethodField()
    total_score = serializers.SerializerMethodField()

    class Meta:
        model = models.GithubScore
        fields = (
            "github_id",
            "year",
            "best_repo",
            "main_repo_score",
            "other_repo_score",
            "score_star",
            "score_fork",
            "reputation_score",
            "total_score",
        )

    def get_main_repo_score(self, stat):
        return stat.repo_score_sum

    def get_other_repo_score(self, stat):
        return stat.score_other_repo_sum

    def get_reputation_score(self, stat):
        return stat.score_star + stat.score_fork

    def get_total_score(self, stat):
        return stat.repo_score_sum + stat.score_other_repo_sum + stat.score_star + stat.score_fork
