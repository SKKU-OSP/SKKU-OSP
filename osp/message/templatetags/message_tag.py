from django import template
from message.models import Message, Notification
from community.models import Board

import json

register = template.Library()


@register.simple_tag
def get_notifications(user):
    if user.is_anonymous:
        return None

    open_types = ["comment", "articlelike", "team_invite", "team_apply"]
    msgs = Notification.objects.filter(
        receiver__user=user).order_by('-send_date')
    new_msg = len(msgs.filter(receiver_read=False)) > 0
    has_new_app = False
    has_new_app_result = False
    for msg in msgs:
        try:
            if msg.type == 'comment':
                msg.icon = 'comment'
                msg.feedback = msg.route_id
            elif msg.type == 'articlelike':
                msg.icon = 'thumb_up'
                msg.feedback = msg.route_id
            elif msg.type == 'team_apply':
                msg.icon = 'assignment_ind'
                msg.feedback = ''
                if not msg.receiver_read:
                    has_new_app = True
            elif msg.type == 'team_apply_result':
                msg.icon = 'assignment_ind'
                msg.feedback = ''
                if not msg.receiver_read:
                    has_new_app_result = True
            elif msg.type == 'team_invite':
                msg.icon = 'group_add'
                msg.feedback = make_team_board_url(msg.route_id)
            elif msg.type == 'team_invite_result':
                msg.icon = 'group_add'
                msg.feedback = ''
            msg.receiver_read = "read" if msg.receiver_read else ""
        except Exception as e:
            print("Exception get_notifications", e)
            msg.body = {"body": msg.body}

    return {'new': new_msg, 'list': msgs, 'open_types': open_types,
            'has_new_app': has_new_app, 'has_new_app_result': has_new_app_result}


@register.simple_tag
def has_new_message(user):
    if user.is_anonymous:
        return None
    msgs = Message.objects.filter(
        receiver__user=user, receiver_read=False, sender__isnull=False)
    return len(msgs) > 0


@register.simple_tag
def make_team_board_url(team_id):
    from django.shortcuts import resolve_url
    try:
        board = Board.objects.get(team__id=team_id)
        return resolve_url('community:Board', board_name=board.name, board_id=board.id)
    except:
        return ''
