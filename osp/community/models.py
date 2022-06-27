from django.db import models
from user.models import Account

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
    pub_date = models.DateField()
    mod_date = models.DateField()
    view_cnt = models.IntegerField(default=0)
    anonymous_writer = models.BooleanField()
    board_id = models.OneToOneField(Board, models.CASCADE)
    writer = models.OneToOneField(Account, models.SET_NULL, null=True)

class ArticleLike(models.Model):
    article = models.OneToOneField(Article, models.CASCADE)
    account = models.OneToOneField(Account, models.CASCADE)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['article', 'account'],
                name='unique_account_article'
            )
        ]

class ArticleComment(models.Model):
    id = models.AutoField(primary_key=True)
    article = models.OneToOneField(Article, models.CASCADE)
    body = models.TextField()
    pub_date = models.DateField()
    mod_date = models.DateField()
    anonymous_writer = models.BooleanField()
    writer = models.OneToOneField(Account, models.SET_NULL, null=True)

class ArticleCommentLike(models.Model):
    comment = models.OneToOneField(ArticleComment, models.CASCADE)
    account = models.OneToOneField(Account, models.CASCADE)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['comment', 'account'],
                name='unique_account_comment'
            )
        ]