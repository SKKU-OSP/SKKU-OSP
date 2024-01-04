from django.db import models

from tag.models import TagIndependent
from team.models import Team
from user.models import Account


class Board(models.Model):
    DEFAULT_BOARDNAME = ['QnA', 'User', '팀 모집', '정보', '홍보']
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=20, unique=True, db_index=True)
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
    is_notice = models.BooleanField(default=False)
    board = models.ForeignKey(Board, models.CASCADE)
    writer = models.ForeignKey(Account, models.SET_NULL, blank=True, null=True)
    period_start = models.DateTimeField(blank=True, null=True)
    period_end = models.DateTimeField(blank=True, null=True)

    def __str__(self) -> str:
        return f'{self.id:03d}:{self.title}'


class ArticleTag(models.Model):
    article = models.ForeignKey(Article, models.CASCADE)
    tag = models.ForeignKey(TagIndependent, models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['article', 'tag'],
                name='unique_article_tag'
            )
        ]

    def __str__(self) -> str:
        return f'{self.tag.name}: {ellipsis_name(self.article.title)}'


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

    def __str__(self) -> str:
        return f'{self.account.user}: {ellipsis_name(self.article.title)}'


class ArticleScrap(models.Model):
    article = models.ForeignKey(Article, models.CASCADE)
    account = models.ForeignKey(Account, models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['article', 'account'],
                name='unique_account_article_Scrap'
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
        return f'{self.id:03d}:{self.body}'


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

    def __str__(self) -> str:
        return f'{self.account.user}: {ellipsis_name(self.comment.body)}'


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


class ArticleImage(models.Model):
    id = models.AutoField(primary_key=True)
    image = models.ImageField(default='', upload_to='img/article/')
    created_user = models.CharField(max_length=150)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20)
    article_id = models.BigIntegerField()

    def __str__(self) -> str:
        return str(self.image.name)


class ArticleFile(models.Model):
    id = models.AutoField(primary_key=True)
    file = models.FileField(default='', upload_to='file/article/')
    filename = models.CharField(max_length=300, default='undefined')
    created_user = models.CharField(max_length=150)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20)
    article_id = models.BigIntegerField()

    def __str__(self) -> str:
        return str(self.image.name)


def ellipsis_name(name, max_length=20):
    if len(name) > max_length:
        return name[:max_length] + '...'
    else:
        return name
