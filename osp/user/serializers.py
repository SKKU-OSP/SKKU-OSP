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
