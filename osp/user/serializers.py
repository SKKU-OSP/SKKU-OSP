from rest_framework import serializers
from user import models

from tag.serializers import TagIndependentSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ("id", "username", "is_superuser")


class AccountSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = models.Account
        fields = (
            "user",
            "photo",
            "github_id"
        )


class AccountDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = models.Account
        fields = (
            "user",
            "photo",
            "github_id",
            "portfolio",
            "introduction"
        )


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.StudentTab
        fields = (
            "id",
            "name",
            "college",
            "dept",
            "github_id",
            "personal_email",
            "primary_email",
            "secondary_email"
        )


class AccountInterestSerializer(serializers.ModelSerializer):
    # account = AccountSerializer()
    tag = TagIndependentSerializer()

    class Meta:
        model = models.AccountInterest
        fields = (
            "id",
            # "account",
            "tag",
            "level"
        )


class AccountPrivacySerializer(serializers.ModelSerializer):
    account = AccountSerializer

    class Meta:
        model = models.AccountPrivacy
        fields = (
            "id",
            "account",
            "open_lvl",
            "is_write",
            "is_open"
        )


class GithubScoreTableSerializer(serializers.ModelSerializer):
    absence_label = serializers.SerializerMethodField()
    plural_major_label = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()

    class Meta:
        model = models.GitHubScoreTable
        fields = (
            "id",
            "year",
            "name",
            "github_id",
            "score",
            "commit_cnt",
            "commit_line",
            "issue_cnt",
            "pr_cnt",
            "repo_cnt",
            "dept",
            "absence",
            "plural_major",
            "personal_email",
            "absence_label",
            "plural_major_label"
        )

    def get_absence_label(self, table):
        if table.absence == 0:
            return "재학"
        elif table.absence == 1:
            return "휴학"
        else:
            return "졸업"

    def get_plural_major_label(self, table):
        if table.plural_major:
            return "복수전공"
        else:
            return "원전공"

    def get_score(self, table):
        return round(table.total_score, 2)


class AccountWithInterestSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    interests = AccountInterestSerializer(
        source='accountinterest_set', many=True, read_only=True)

    class Meta:
        model = models.Account
        fields = (
            "user",
            "photo",
            "github_id",
            "introduction",
            "interests"
        )

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

class QnAImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.QnAImage
        fields = ('id', 'file', 'name')

class QnASerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    images = QnAImageSerializer(many=True, read_only=True)

    class Meta:
        model = models.QnA
        fields = ('id', 'user', 'type', 'content', 'created_at', 'solved', 'images')