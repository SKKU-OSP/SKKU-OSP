from rest_framework import serializers
from message import models


class MessageSerializer(serializers.ModelSerializer):
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
