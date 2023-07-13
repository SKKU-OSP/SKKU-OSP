from rest_framework import serializers
from community import models

from user.serializers import AccountSerializer


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


class ArticleSerializer(serializers.ModelSerializer):
    board = BoardSerializer
    writer = AccountSerializer

    class Meta:
        model = models.Article
        fields = (
            "id",
            "title",
            "body",
            "pub_date",
            "mod_date",
            "view_cnt",
            "anonymous_writer",
            "is_notice",
            "board",
            "writer",
            "period_start",
            "period_end"
        )
