from django import template
from django.db.models import Q
from django.utils.safestring import mark_safe
from user.models import Account, User
from team.models import TeamMember
from community.models import ArticleComment, ArticleLike, Article, Board
from datetime import datetime, timedelta, timezone
from django.utils.safestring import mark_safe

register = template.Library()
@register.filter
def time_left(date):
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
def user_article(user_model):
    if not user_model.is_authenticated:
        return '로그인 필요'
    account = Account.objects.get(user=user_model)
    return len(Article.objects.filter(writer=account))

@register.filter
def user_comment(user_model):
    if not user_model.is_authenticated:
        return '로그인 필요'
    account = Account.objects.get(user=user_model)
    return len(ArticleComment.objects.filter(writer=account))

@register.filter
def user_like(user_model):
    if not user_model.is_authenticated:
        return '로그인 필요'
    account = Account.objects.get(user=user_model)
    return len(ArticleLike.objects.filter(account=account))

@register.filter
def anonymous_checked(a_writer):
    if a_writer:
        return mark_safe('checked')
    else:
        return ''

@register.simple_tag
def board_sidebar_items(request):
    team_board_query = Q()
    if request.user.is_authenticated:
        user = User.objects.get(username=request.user)
        account = Account.objects.get(user=user)
        team_list = [x.team.name for x in TeamMember.objects.filter(member=account).prefetch_related('team')]
        team_board_query = Q(name__in=team_list)
    result = ''
    for board in Board.objects.filter(team_board_query | ~Q(board_type='Team')):
        result += f'''
            <li class="list-group-item">
            <a href="/community/{board.name}">{board.name.capitalize()}</a>
            </li>
        '''
    return mark_safe(result)
