from rest_framework import serializers
from community import models


class BoardSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Board
        fields = (
            "id",
            "name",
            "board_type",
            "anonymous_writer",
            "team_id"
        )
