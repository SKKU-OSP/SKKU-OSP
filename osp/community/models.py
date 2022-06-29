from django.db import models
from user.models import Account
from tag.models import Tag

# Create your models here.
class Board(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=20)
    board_type = models.CharField(max_length=10)
    anonymous_writer = models.BooleanField()

class Article(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100)
    body = models.TextField()
    pub_date = models.DateTimeField()
    mod_date = models.DateTimeField()
    view_cnt = models.IntegerField(default=0)
    anonymous_writer = models.BooleanField()
    board_id = models.ForeignKey(Board, models.CASCADE)
    writer = models.ForeignKey(Account, models.SET_NULL, blank=True, null=True)
    period_start = models.DateTimeField(blank=True, null=True)
    period_end = models.DateTimeField(blank=True, null=True)

class ArticleTag(models.Model):
    article = models.ForeignKey(Article, models.CASCADE)
    tag = models.ForeignKey(Tag, models.CASCADE)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['article', 'tag'],
                name='unique_article_tag'
            )
        ]

class ArticleLike(models.Model):
    article = models.ForeignKey(Article, models.CASCADE)
    account = models.ForeignKey(Account, models.CASCADE)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['article', 'account'],
                name='unique_account_article'
            )
        ]

class ArticleComment(models.Model):
    id = models.AutoField(primary_key=True)
    article = models.ForeignKey(Article, models.CASCADE)
    body = models.TextField()
    pub_date = models.DateTimeField()
    mod_date = models.DateTimeField()
    anonymous_writer = models.BooleanField()
    writer = models.ForeignKey(Account, models.SET_NULL, blank=True, null=True)

class ArticleCommentLike(models.Model):
    comment = models.ForeignKey(ArticleComment, models.CASCADE)
    account = models.ForeignKey(Account, models.CASCADE)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['comment', 'account'],
                name='unique_account_comment'
            )
        ]