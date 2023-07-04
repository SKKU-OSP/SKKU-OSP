from django.db import models

from user.models import Account


class Message(models.Model):
    id = models.AutoField(primary_key=True)
    sender = models.ForeignKey(
        Account, models.CASCADE, related_name='sender', null=True, blank=True)
    receiver = models.ForeignKey(
        Account, models.CASCADE, related_name='receiver')
    body = models.TextField()
    send_date = models.DateTimeField(auto_now_add=True)
    receiver_read = models.BooleanField()
    sender_delete = models.BooleanField()
    receiver_delete = models.BooleanField()


class Notification(models.Model):
    id = models.AutoField(primary_key=True)
    type = models.CharField(max_length=20)
    sender_name = models.CharField(max_length=150)
    receiver = models.ForeignKey(Account, models.CASCADE)
    body = models.TextField()
    send_date = models.DateTimeField(auto_now_add=True)
    receiver_read = models.BooleanField()
    receiver_delete = models.BooleanField()
    route_id = models.IntegerField(null=True, blank=True)
