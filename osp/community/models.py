from django.db import models
from user.models import Account
from tag.models import Tag
from team.models import Team
# Create your models here.
class Board(models.Model):
    DEFAULT_BOARDNAME = ['QnA','Team','Education','Notice']
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=20)
    board_type = models.CharField(max_length=10)
    anonymous_writer = models.BooleanField()
    team = models.ForeignKey(Team, models.CASCADE, blank=True, null=True)
    
    def __str__(self) -> str:
        return f'{self.id:03d}:{self.name}({self.board_type})'

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
    
    def __str__(self) -> str:
        return f'{self.id:03d}:{self.title}'

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
#todo scrap

# class ArticleScrap(models.Model):
#     article = models.ForeignKey(Article, models.CASCADE)
#     account = models.ForeignKey(Account, models.CASCADE)
#     class Meta:
#         constraints = [
#             models.UniqueConstraint(
#                 fields=['article', 'account'],
#                 name='unique_account_article'
#             )
#         ]

class ArticleBookmark(models.Model):
    id = models.AutoField(primary_key=True)
    article = models.ForeignKey(Article, models.CASCADE)
    account = models.ForeignKey(Account, models.CASCADE)
    bookmark_date = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['article', 'account'],
                name='unique_account_article_bookmark'
            )
        ]

class ArticleComment(models.Model):
    id = models.AutoField(primary_key=True)
    article = models.ForeignKey(Article, models.CASCADE)
    body = models.TextField()
    pub_date = models.DateTimeField()
    del_date = models.DateTimeField()
    anonymous_writer = models.BooleanField()
    is_deleted = models.BooleanField(default=False)
    writer = models.ForeignKey(Account, models.SET_NULL, blank=True, null=True)
    
    def __str__(self) -> str:
        return f'{self.id:03d}:{self.body})'

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

class TeamRecruitArticle(models.Model):
    team = models.ForeignKey(Team, models.CASCADE)
    article = models.ForeignKey(Article, models.CASCADE)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['team', 'article'],
                name='unique_team_article'
            )
        ]