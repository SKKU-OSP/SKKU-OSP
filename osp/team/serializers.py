from rest_framework import serializers

from tag.serializers import TagIndependentSerializer
from team import models
from user.serializers import AccountSerializer


class TeamSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Team
        fields = (
            "id",
            "name",
            "description",
            "image",
            "create_date"
        )


class TeamMemberSerializer(serializers.ModelSerializer):
    # team = TeamSerializer()
    member = AccountSerializer()

    class Meta:
        model = models.TeamMember
        fields = (
            # "team",
            "member",
            "is_admin"
        )


class TeamTagSerializer(serializers.ModelSerializer):
    team = TeamSerializer()
    tag = TagIndependentSerializer()

    class Meta:
        model = models.TeamMember
        fields = (
            "team",
            "tag",
        )


class TeamInviteMessageSerializer(serializers.ModelSerializer):
    team = TeamSerializer()
    account = AccountSerializer()

    class Meta:
        model = models.TeamInviteMessage
        fields = (
            "id",
            "team",
            "account",
            "message",
            "status",
            "direction",
            "send_date",
        )


class TeamApplyMessageSerializer(serializers.ModelSerializer):
    team = TeamSerializer()
    account = AccountSerializer()

    class Meta:
        model = models.TeamApplyMessage
        fields = (
            "id",
            "team",
            "account",
            "message",
            "status",
            "direction",
            "send_date",
        )
