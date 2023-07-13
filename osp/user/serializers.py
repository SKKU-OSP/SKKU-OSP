from rest_framework import serializers
from user import models


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
