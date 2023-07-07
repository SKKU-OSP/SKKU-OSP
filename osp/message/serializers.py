from rest_framework import serializers
from message import models

from user.serializers import AccountSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = AccountSerializer()
    receiver = AccountSerializer()

    class Meta:
        model = models.Message
        fields = (
            "id",
            "sender",
            "receiver",
            "body",
            "send_date",
            "receiver_read",
            "sender_delete",
            "receiver_delete",
        )


class NotificationSerializer(serializers.ModelSerializer):
    receiver = AccountSerializer()

    class Meta:
        model = models.Notification

        fields = (
            "id",
            "type",
            "sender_name",
            "receiver",
            "body",
            "send_date",
            "receiver_read",
            "receiver_delete",
            "route_id",
        )