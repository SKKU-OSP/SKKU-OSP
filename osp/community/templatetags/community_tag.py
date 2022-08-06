from django import template
from django.db.models import Q
from django.shortcuts import resolve_url
from django.utils.safestring import mark_safe

from user.models import Account, User
from team.models import TeamMember, Team
from community.models import ArticleComment, Article, ArticleLike, ArticleScrap, Board
from datetime import datetime, timedelta, timezone

register = template.Library()
@register.filter
def time_before(date):
    delta = datetime.now() - date
    repr_string = ''
    if delta < timedelta(seconds=60):
        repr_string = '방금'
    elif delta < timedelta(seconds=3600):
        repr_string = f'{delta.seconds // 60}분 전'
    elif delta < timedelta(hours=24):
        repr_string = f'{delta.seconds // 3600}시간 전'
    else:
        repr_string = f'{delta.days}일 전'
    return repr_string

@register.filter
def article_like(article):
    return len(ArticleLike.objects.filter(article=article))

@register.filter
def article_comment(article):
    return len(ArticleComment.objects.filter(article=article))

@register.filter
def article_scrap(article):
    return len(ArticleScrap.objects.filter(article=article))

@register.filter
def anonymous_checked(a_writer):
    if a_writer:
        return mark_safe('checked')
    else:
        return ''

@register.simple_tag(takes_context=True)
def board_sidebar_normal_board(context, request):
    result = ''
    for boardname in Board.DEFAULT_BOARDNAME:
        board = Board.objects.get(name=boardname)
        url = resolve_url('community:Board',board_name=board.name,board_id=board.id)
        if board == context['board']:
            result += f'''
            <div class="boardgroup-item selected">
            <a href="{url}">{board.name.capitalize()}</a>
            </div>
            '''
        else:
            result += f'''
            <div class="boardgroup-item">
            <a href="{url}">{board.name.capitalize()}</a>
            </div>
            '''
        
    return mark_safe(result)

@register.simple_tag(takes_context=True)
def board_sidebar_team_board(context, request):
    team_board_query = Q()
    result = ''
    if request.user and request.user.is_authenticated:
        user = User.objects.get(username=request.user)
        account = Account.objects.get(user=user)
        team_list = [x.team.name for x in TeamMember.objects.filter(member=account).prefetch_related('team')]
        team_board_query = Q(name__in=team_list)

        for board in Board.objects.filter(team_board_query):
            url = resolve_url('community:Board', board_name=board.name, board_id=board.id)
            if board == context['board']:
                result += f'''
                <div class="boardgroup-item selected">
                <a href="{url}">{board.name.capitalize()}</a>
                </div>
                '''
            else:
                result += f'''
                <div class="boardgroup-item">
                <a href="{url}">{board.name.capitalize()}</a>
                </div>
                '''
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

@register.simple_tag()
def is_period_end(date):
    if isinstance(date, datetime):
        return date < datetime.now()
    else:
        return True

