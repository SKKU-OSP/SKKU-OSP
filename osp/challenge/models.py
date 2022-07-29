from django.db import models

from user.models import Account

# Create your models here.
class Challenge(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=200)
    image = models.ImageField(default='img/challenge/default.jpg', upload_to='img/challenge/')
    sql = models.TextField()
    max_progress = models.IntegerField(blank=True, null=True, default=True)
    
class ChallengeAchieve(models.Model):
    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(Account, models.CASCADE)
    acheive_date = models.DateTimeField()