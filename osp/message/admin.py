from django.contrib import admin
from .models import Message
import json

class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'parse_body', 'send_date')
    @admin.display(description='body')
    def parse_body(self, obj):
        try:
            body_json = json.loads(obj.body)
            return body_json['body']
        except :
            return obj.body

admin.site.register(Message, MessageAdmin)
