from rest_framework import serializers

from tag.serializers import TagIndependentSerializer
from team import models
from user.serializers import AccountSerializer


class TeamSerializer(serializers.ModelSerializer):
    member_cnt = serializers.SerializerMethodField()

    class Meta:
        model = models.Team
        fields = (
            "id",
            "name",
            "description",
            "image",
            "create_date",
            "member_cnt"
        )

    def get_member_cnt(self, obj):
        return obj.member_cnt


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
