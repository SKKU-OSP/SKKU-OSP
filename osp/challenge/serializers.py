from rest_framework import serializers
from challenge import models

from user.serializers import AccountSerializer


class ChallengeSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Challenge
        fields = (
            "id",
            "name",
            "description",
            "tier",
        )


class ChallengeAchieveSerializer(serializers.ModelSerializer):
    # account = AccountSerializer()
    challenge = ChallengeSerializer()

    class Meta:
        model = models.ChallengeAchieve

        fields = (
            "id",
            # "account",
            "challenge",
            "progress",
            "acheive_date",
        )
