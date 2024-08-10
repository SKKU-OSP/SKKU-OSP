import json

from rest_framework import serializers

from home import models


class AnnualOverviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AnnualOverview
        fields = ("id", "case_num", "score", "score_std", "commit", "commit_std", "star",
                  "star_std", "pr", "pr_std", "issue", "issue_std", "class_num", "level_step")

    def to_representation(self, instance):
        # Get the original representation of the model data
        ret = super().to_representation(instance)

        # Json 파싱해야할 필드 목록
        fields_to_parse = ["score", "score_std", "commit", "commit_std", "star",
                           "star_std", "pr", "pr_std", "issue", "issue_std", "class_num", "level_step"]

        # Parse the string fields and convert them to lists
        for field in fields_to_parse:
            if isinstance(ret[field], str):
                ret[field] = json.loads(ret[field])

        return ret


class AnnualTotalSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AnnualTotal
        fields = ("id", "case_num", "student_KP", "student_total",
                  "commit", "star", "repo", "repo_total")

    def to_representation(self, instance):
        # Get the original representation of the model data
        ret = super().to_representation(instance)

        # Json 파싱해야할 필드 목록
        fields_to_parse = ["student_KP",
                           "student_total", "commit", "star", "repo"]

        # Parse the string fields and convert them to lists
        for field in fields_to_parse:
            if isinstance(ret[field], str):
                ret[field] = json.loads(ret[field])

        return ret


class DistScoreSerializer(serializers.ModelSerializer):
    class Meta:

        model = models.DistScore
        fields = ("id", "case_num", "year", "score", "score_sid", "score_sid_std",
                  "score_sid_pct", "score_dept", "score_dept_std", "score_dept_pct")

    def to_representation(self, instance):
        # Get the original representation of the model data
        ret = super().to_representation(instance)

        # Json 파싱해야할 필드 목록
        fields_to_parse = ["score", "score_sid", "score_sid_std",
                           "score_sid_pct", "score_dept", "score_dept_std", "score_dept_pct"]

        # Parse the string fields and convert them to lists
        for field in fields_to_parse:
            if isinstance(ret[field], str):
                ret[field] = json.loads(ret[field])

        return ret


class DistFactorSerializer(serializers.ModelSerializer):
    class Meta:

        model = models.DistFactor
        fields = ("id", "case_num", "year", "factor", "value", "value_sid", "value_sid_std",
                  "value_sid_pct", "value_dept", "value_dept_std", "value_dept_pct")

    def to_representation(self, instance):
        # Get the original representation of the model data
        ret = super().to_representation(instance)

        # Json 파싱해야할 필드 목록
        fields_to_parse = ["value", "value_sid", "value_sid_std",
                           "value_sid_pct", "value_dept", "value_dept_std", "value_dept_pct"]

        # Parse the string fields and convert them to lists
        for field in fields_to_parse:
            if isinstance(ret[field], str):
                ret[field] = json.loads(ret[field])

        return ret


class AnnualOverviewDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AnnualOverview
        fields = ("id", "score", "commit", "star", "pr",
                  "issue", "class_num", "level_step")

    def to_representation(self, instance):
        # Get the original representation of the model data
        ret = super().to_representation(instance)

        # Json 파싱해야할 필드 목록
        fields_to_parse = ["score", "commit", "star",
                           "pr", "issue",  "class_num", "level_step"]

        # Parse the string fields and convert them to lists
        for field in fields_to_parse:
            if isinstance(ret[field], str):
                ret[field] = json.loads(ret[field])

        return ret


class DistScoreDashboardSerializer(serializers.ModelSerializer):
    class Meta:

        model = models.DistScore
        fields = ("id", "year", "score")

    def to_representation(self, instance):
        # Get the original representation of the model data
        ret = super().to_representation(instance)

        if isinstance(ret["score"], str):
            ret["score"] = json.loads(ret["score"])

        return ret


class DistFactorDashboardSerializer(serializers.ModelSerializer):
    class Meta:

        model = models.DistFactor
        fields = ("id", "year", "factor", "value")

    def to_representation(self, instance):
        # Get the original representation of the model data
        ret = super().to_representation(instance)

        if isinstance(ret["value"], str):
            ret["value"] = json.loads(ret["value"])

        return ret

class RepositoryOwnerUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Repository
        fields = ['owner']
