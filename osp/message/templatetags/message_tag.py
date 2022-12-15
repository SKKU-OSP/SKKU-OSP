from django import template
from message.models import Message

import json

register = template.Library()
@register.simple_tag
def get_notifications(user):
    if user.is_anonymous:
        return None

    open_types = ["comment", "articlelike", "team_invite", "team_apply"]
    msgs = Message.objects.filter(sender__isnull=True, receiver__user=user).order_by('-send_date')
    new_msg = len(msgs.filter(receiver_read=False)) > 0
    for msg in msgs:
        try:
            tmp = json.loads(msg.body)
            if tmp['type'] == 'comment':
                msg.icon = 'comment'
            if tmp['type'] == 'articlelike':
                msg.icon = 'thumb_up'
            if tmp['type'] == 'team_apply' or tmp['type'] == 'team_apply_result':
                msg.icon = 'assignment_ind'
            if tmp['type'] == 'team_invite' or tmp['type'] == 'team_invite_result':
                msg.icon = 'group_add'
            msg.body = tmp
        except:
            tmp = msg.body
            msg.body={"body":tmp}

    return {'new': new_msg, 'list': msgs, 'open_types': open_types}

@register.simple_tag
def get_new_message(user):
    if user.is_anonymous:
        return None
    msgs = Message.objects.filter(receiver__user=user, receiver_read=False,sender__isnull=False)
    return len(msgs) > 0