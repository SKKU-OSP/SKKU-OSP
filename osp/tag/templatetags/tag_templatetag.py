from django import template

register = template.Library()
from django.utils.safestring import mark_safe
from tag.models import Tag
from team.models import TeamMember,TeamInviteMessage
from user.models import Account

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
    account = Account.objects.get(user=user)
    if TeamMember.objects.filter(team=team,member=account):
        return True
    else:
        return False

@register.simple_tag
def teaminvitemessage(team, user):
    account = Account.objects.get(user=user)
    return TeamInviteMessage.objects.filter(team=team,account=account).first()

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

