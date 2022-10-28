from django.db import models

from user.models import Account

# Create your models here.
class Challenge(models.Model):
    TIER_CHOICE = (
        (0, 'UNKNOWN'),
        (1, 'BRONZE'),
        (2, 'SILVER'),
        (3, 'GOLD')
    )
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=200)
    image = models.ImageField(default='img/challenge/default.jpg', upload_to='img/challenge/')
    sql = models.TextField()
    max_progress = models.IntegerField(blank=True, null=True, default=True)
    tier = models.IntegerField(choices=TIER_CHOICE)
    
class ChallengeAchieve(models.Model):
    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(Account, models.CASCADE)
    challenge = models.ForeignKey(Challenge, models.CASCADE)
    progress = models.IntegerField(default=0)
    acheive_date = models.DateTimeField(blank=True, null=True, default=True)