import re

from rest_framework import serializers

from message import models
from user.serializers import AccountSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = AccountSerializer()
    receiver = AccountSerializer()
    format_date = serializers.SerializerMethodField()
    format_body = serializers.SerializerMethodField()
    board_link = serializers.SerializerMethodField()

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
            "format_date",
            "format_body",
            "board_link"
        )

    def get_format_date(self, message):
        output_date = message.send_date.strftime('%m/%d,%I:%M %p')

        return output_date

    def get_format_body(self, message):
        # 게시판 링크 a 태그 찾기
        pattern = r"<a href='/community/board/(.*?)'>링크</a>"
        match = re.search(pattern, message.body)

        if match:
            # 링크 기준으로 split하여 두개의 문자열을 반환
            format_body = re.sub('<br>', '\n', message.body)
            format_body = format_body.split(match.group(0))
            return format_body
        else:
            return [None, None]

    def get_board_link(self, message):
        # 게시판 링크 a 태그 찾기
        pattern = r"<a href='/community/board/(.*?)'>링크</a>"
        match = re.search(pattern, message.body)

        if match:
            # 게시판 이름(=팀 이름) 반환
            return match.group(1)
        else:
            return None


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
