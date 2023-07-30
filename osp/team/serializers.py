from rest_framework import serializers
from team import models

from user.serializers import AccountSerializer
from tag.serializers import TagIndependentSerializer



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


class TemaTagSerializer(serializers.ModelSerializer):
    team = TeamSerializer()
    tag = TagIndependentSerializer()

    class Meta:
        model = models.TeamMember
        fields = (
            "team",
            "tag",
        )
=======
>>>>>>> cc40bd7c1e4ab22fe6a831cfee1bf5e32428e353
