from rest_framework import serializers

from community import models
from tag.serializers import TagIndependentSerializer
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


class ArticleOfCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Article
        fields = (
            "id",
            "title",
        )


class ArticleSerializer(serializers.ModelSerializer):
    board = BoardSerializer()
    writer = AccountSerializer()
    like_cnt = serializers.SerializerMethodField()
    scrap_cnt = serializers.SerializerMethodField()

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
            "is_hero",
            "board",
            "writer",
            "period_start",
            "period_end",
            "like_cnt",
            "scrap_cnt"
        )

    def get_like_cnt(self, article):
        return article.articlelike_set.count()

    def get_scrap_cnt(self, article):
        return article.articlescrap_set.count()


class BoardArticleSerializer(serializers.ModelSerializer):
    board = BoardSerializer()
    writer = AccountSerializer()
    like_cnt = serializers.SerializerMethodField()
    scrap_cnt = serializers.SerializerMethodField()
    comment_cnt = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()

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
            "is_hero",
            "board",
            "writer",
            "period_start",
            "period_end",
            "like_cnt",
            "scrap_cnt",
            "comment_cnt",
            "tags"
        )

    def get_like_cnt(self, article):
        return article.articlelike_set.count()

    def get_scrap_cnt(self, article):
        return article.articlescrap_set.count()

    def get_comment_cnt(self, article):
        return article.articlecomment_set.count()

    def get_tags(self, article):
        return article.tags


class ArticleCommentSerializer(serializers.ModelSerializer):
    writer = AccountSerializer()
    article = ArticleOfCommentSerializer()
    like_cnt = serializers.SerializerMethodField()
    board = serializers.SerializerMethodField()

    class Meta:
        model = models.ArticleComment
        fields = ("id",
                  "article",
                  "body",
                  "pub_date",
                  "del_date",
                  "anonymous_writer",
                  "is_deleted",
                  "writer",
                  "like_cnt",
                  "board"
                  )

    def get_like_cnt(self, comment):
        return comment.articlecommentlike_set.count()

    def get_board(self, comment):
        return BoardSerializer(comment.article.board).data


class RecruitArticleSerializer(serializers.ModelSerializer):
    # Article
    board = BoardSerializer()
    writer = AccountSerializer()
    like_cnt = serializers.SerializerMethodField()
    scrap_cnt = serializers.SerializerMethodField()
    comment_cnt = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    member_cnt = serializers.SerializerMethodField()

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
            "period_end",
            "like_cnt",
            "scrap_cnt",
            "comment_cnt",
            "tags",
            "team_name",
            "member_cnt"
        )

    def get_like_cnt(self, article):
        return article.articlelike_set.count()

    def get_scrap_cnt(self, article):
        return article.articlescrap_set.count()

    def get_comment_cnt(self, article):
        return article.articlecomment_set.count()

    def get_tags(self, article):
        return article.articletag_set.values_list('tag', flat=True)

    def get_team_name(self, obj):
        return obj.team_name

    def get_member_cnt(self, obj):
        return obj.member_cnt
