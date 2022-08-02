from django import template

register = template.Library()
from django.utils.safestring import mark_safe
from tag.models import Tag
from team.models import TeamMember,TeamInviteMessage, Team
from user.models import Account, AccountInterest
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
def is_teammember(team, user):
    if user.is_anonymous: user = None
    account = Account.objects.filter(user=user).first()
    if TeamMember.objects.filter(team=team,member=account):
        return True
    else:
        return False




@register.simple_tag
def teaminvitemessage(team, user):
    if user.is_anonymous: user = None
    account = Account.objects.filter(user=user).first()
    return TeamInviteMessage.objects.filter(team=team,account=account,status=0).first()

@register.simple_tag
def get_teamappliedmessage_waited(team):
    return TeamInviteMessage.objects.filter(team=team,status=0)

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
def is_teammember_admin(team, user):
    if not user.is_anonymous:
        tm =  TeamMember.objects.filter(team=team, member__user=user).first()
        if tm and tm.is_admin:
            return True
    return False

@register.simple_tag
def apply_messages(team):
    apply_messages = TeamInviteMessage.objects.filter(
        team=team,
        direction=False,
        status=0
    )
    return apply_messages

@register.simple_tag
def get_admin_team(user):
    if not user.is_anonymous:
        team_li = list(TeamMember.objects.filter(member__user=user, is_admin=1).values_list("team_id", flat=True))
        return Team.objects.filter(id__in=team_li)
    return None

@register.simple_tag
def get_notifications(user):
    if user.is_anonymous:
        return None

    msgs = Message.objects.filter(sender__isnull=True, receiver__user=user)
    for msg in msgs:
        try:
            tmp = json.loads(msg.body)
            msg.body = tmp
        except:
            tmp = msg.body
            msg.body={"body":tmp}

    return msgs

@register.simple_tag
def is_article_thumb_up(article, user):
    if user.is_anonymous:
        return False
    if ArticleLike.objects.filter(article=article, account__user=user):
        return True
    else:
        return False

@register.simple_tag
def is_article_scrap(article, user):
    if user.is_anonymous:
        return False
    if ArticleScrap.objects.filter(article=article, account__user=user):
        return True
    else:
        return False
#
@register.simple_tag
def get_account_tags(account):
    return AccountInterest.objects.filter(account=account)
