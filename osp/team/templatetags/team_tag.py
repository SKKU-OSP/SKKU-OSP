from django import template
from django.utils.safestring import mark_safe

from osp.settings import MEDIA_URL
from user.models import Account
from team.models import TeamMember,TeamInviteMessage, Team
from community.models import Board

import os

register = template.Library()
@register.simple_tag
def var_set(var):
    return var

# message_tag에만 사용하여 이동, 사용하지 않음
@register.simple_tag
def make_team_board_url(team_id):
    from django.shortcuts import resolve_url
    try:
        board = Board.objects.get(team__id=team_id)
        return resolve_url('community:Board', board_name=board.name, board_id=board.id)
    except:
        return ''

@register.simple_tag
def var_add(var1, var2):
    if not var1:
        var1 = 0
    if not var2:
        var2 = 0
    return int(var1) + int(var2)


@register.simple_tag
def teammember_options_exclude_members(user, team):
    try:
        result = ''
        team_members = list(TeamMember.objects.filter(team=team).values_list('member',flat=True))
        usernames = list(Account.objects.exclude(user__is_superuser=True).exclude(user__id__in=team_members).values_list('user__username',flat=True))
        for username in usernames:
            result += f'<option value="{username}">{username}</option>'
    except:
        result = ''
    return mark_safe(result)

@register.simple_tag
def team_options_exclude_user(user, invite_user, recommend_team=-1):
    try:
        account = Account.objects.get(user=user)
        result = ''
        li1 = list(TeamMember.objects.filter(member=account).values_list('team_id',flat=True))
        li2 = list(TeamMember.objects.filter(member__user=invite_user).values_list('team_id',flat=True))
        teams = Team.objects.filter(id__in=list(set(li1)-set(li2)))
        for team in teams:
            if recommend_team!=-1 and team.id == int(recommend_team):
                result += f'<option team_id="{team.id}" value="{team.id}" selected>{team.name}</option>'
            else:
                result += f'<option team_id="{team.id}" value="{team.id}">{team.name}</option>'

    except:
        result = ''
    return mark_safe(result)


@register.simple_tag
def team_options(user):
    try:
        account = Account.objects.get(user=user)
        result = '<option value="" disabled selected>팀 선택</option>'
        li = TeamMember.objects.filter(member=account).values_list('team_id')
        teams = Team.objects.filter(id__in=li)
        for team in teams:
            result += f'<option value="{team.id}">{team.name}</option>'
    except:
        result = ''
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
def teamapplymessage(team, user):
    if user.is_anonymous: user = None
    account = Account.objects.filter(user=user).first()
    return TeamInviteMessage.objects.filter(team=team,account=account,status=0,direction=False).first()

@register.simple_tag
def get_teamappliedmessage_waited(team):
    return TeamInviteMessage.objects.filter(team=team,status=0,direction=False)


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
def get_team(user):
    if not user.is_anonymous:
        team_li = list(TeamMember.objects.filter(member__user=user).values_list("team_id", flat=True))
        return Team.objects.filter(id__in=team_li)
    return None


@register.simple_tag
def get_sent_teamapply(user):
    apply_messages = TeamInviteMessage.objects.filter(
        account__user_id=user.id,
        direction=False,
    )
    return apply_messages

# 팀의 디폴트 이미지의 경로를 리턴
@register.simple_tag
def get_default_team_image():
    return os.path.join(MEDIA_URL, Team.image.field.default)
