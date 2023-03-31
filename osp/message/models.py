from django.db import models

from user.models import Account

# Create your models here.
class Message(models.Model):
    id = models.AutoField(primary_key=True)
    # If sender is null, this message is a notification message
    sender = models.ForeignKey(Account, models.CASCADE, related_name='sender', null=True, blank=True)
    receiver = models.ForeignKey(Account, models.CASCADE, related_name='receiver')
    body = models.TextField()
    send_date = models.DateTimeField(auto_now_add=True)
    receiver_read = models.BooleanField()
    sender_delete = models.BooleanField()
    receiver_delete = models.BooleanField()