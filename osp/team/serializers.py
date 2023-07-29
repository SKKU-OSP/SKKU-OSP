from rest_framework import serializers
from team import models


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
