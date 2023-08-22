from rest_framework import serializers
from message import models

from user.serializers import AccountSerializer
from datetime import datetime

class MessageSerializer(serializers.ModelSerializer):
    sender = AccountSerializer()
    receiver = AccountSerializer()
    format_date = serializers.SerializerMethodField()

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
            "format_date"
        )
    def get_format_date(self,message):
        output_date = message.send_date.strftime('%m/%d,%I:%M %p')
        
        return output_date


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
