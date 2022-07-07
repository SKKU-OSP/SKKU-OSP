from django import template
from django.contrib.auth.models import AnonymousUser
from user.models import Account
from community.models import ArticleComment, ArticleLike, Article
from datetime import datetime, timedelta, timezone
from django.utils.safestring import mark_safe

register = template.Library()
@register.filter
def time_left(date):
    delta = datetime.now(timezone(timedelta(hours=9))) - date
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