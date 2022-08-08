from django import template

register = template.Library()
from django.utils.safestring import mark_safe
from tag.models import Tag
from user.models import AccountInterest
from message.models import Message
from community.models import *
import json

@register.simple_tag
def category_tag(request):
    result = ''
    tags = Tag.objects.all()
    
    type_list = list(tags.values_list("type", flat=True).distinct())

    for t in type_list:
        result += f'<optgroup label="{t}">'
        objects = Tag.objects.filter(type=t)
        name_list = list(objects.values_list("name", flat=True).distinct())
        name_list.sort()
        for n in name_list:
            result += f'<option class="tag-{t}" value="{n}">{n}</option>'
        result += '</optgroup>'

    return mark_safe(result)

@register.simple_tag
def get_account_tags(account):
    return AccountInterest.objects.filter(account=account)

@register.simple_tag
def category_tag_domain(request):
    result = ''

    tags = Tag.objects.filter(type="domain")
    type_list = list(tags.values_list("type", flat=True).distinct())

    for t in type_list:
        result += f'<optgroup label="{t}">'
        objects = Tag.objects.filter(type=t)
        name_list = list(objects.values_list("name", flat=True).distinct())
        name_list.sort()
        for n in name_list:
            result += f'<option class="tag-{t}" value="{n}">{n}</option>'
        result += '</optgroup>'

    return mark_safe(result)

@register.simple_tag
def category_tag_language(request):
    result = ''
    
    tags = Tag.objects.exclude(type="domain")
    type_list = list(tags.values_list("type", flat=True).distinct())

    for t in type_list:
        result += f'<optgroup label="{t}">'
        objects = Tag.objects.filter(type=t)
        name_list = list(objects.values_list("name", flat=True).distinct())
        name_list.sort()
        for n in name_list:
            result += f'<option class="tag-{t}" value="{n}">{n}</option>'
        result += '</optgroup>'

    return mark_safe(result)

@register.simple_tag
def get_notifications(user):
    if user.is_anonymous:
        return None

    msgs = Message.objects.filter(sender__isnull=True, receiver__user=user)
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

    return {'new': new_msg, 'list': msgs}
