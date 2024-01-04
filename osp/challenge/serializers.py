from rest_framework import serializers

from challenge import models


class ChallengeSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Challenge
        fields = (
            "id",
            "name",
            "description",
            "tier",
            "max_progress"
        )


class ChallengeAchieveSerializer(serializers.ModelSerializer):
    challenge = ChallengeSerializer()

    class Meta:
        model = models.ChallengeAchieve
        fields = (
            "id",
            "challenge",
            "progress",
            "acheive_date",
        )
