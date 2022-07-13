from django.db import models
from django.dispatch import receiver
from tag.models import Tag
from user.models import Account
from community.models import Article

# Create your models here.
class Team(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=20)
    description = models.CharField(max_length=150)
    image = models.ImageField(default='img/team/default.jpg', upload_to='img/team/')
    create_date = models.DateTimeField()
    
    def __str__(self) -> str:
        return self.name

class TeamTag(models.Model):
    team = models.ForeignKey(Team, models.CASCADE)
    tag = models.ForeignKey(Tag, models.CASCADE)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['team', 'tag'],
                name='unique_team_tag'
            )
        ]

class TeamMember(models.Model):
    team = models.ForeignKey(Team, models.CASCADE)
    member = models.ForeignKey(Account, models.CASCADE)
    is_admin = models.BooleanField(default=False)
    
    def __str__(self) -> str:
        return f'{self.team.name} - {self.member.user.username}'
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['team', 'member'],
                name='unique_team_member'
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

class TeamInviteMessage(models.Model):
    id = models.AutoField(primary_key=True)
    target_team = models.ForeignKey(Team, models.CASCADE)
    target_account = models.ForeignKey(Account, models.CASCADE)
    message = models.TextField(max_length=200)
    status = models.IntegerField()
    is_apply = models.BooleanField()
    send_date = models.DateTimeField()