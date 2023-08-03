from rest_framework import serializers
from home import models

from tag.serializers import TagIndependentSerializer


class AnnualOverviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AnnualOverview
        fields = ("id", "case_num", "score", "score_std", "commit", "commit_std", "star",
                  "star_std", "pr", "pr_std", "issue", "issue_std", "class_num", "level_step")
