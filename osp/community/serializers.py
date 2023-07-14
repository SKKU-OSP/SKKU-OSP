from rest_framework import serializers
from community import models

from user.serializers import AccountSerializer
from tag.serializers import TagIndependentSerializer


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


class ArticleCommentSerializer(serializers.ModelSerializer):
    writer = AccountSerializer

    class Meta:
        model = models.ArticleComment
        fields = ("id",
                  #   "article", # article에서 article Comment 불러오므로 배제
                  "body",
                  "pub_date",
                  "del_date",
                  "anonymous_writer",
                  "is_deleted",
                  "writer"
                  )
