from django import template

from django.utils.safestring import mark_safe
from tag.models import Tag
from user.models import AccountInterest
from community.models import *

register = template.Library()

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
def email_domain_tag(request):
    result = '<optgroup>'
    result += '<option class="email-domain" selected>직접입력</option>'
    domain_list  = ["naver.com", "gmail.com", "daum.net", "nate.com", "yahoo.com"]
    for d in domain_list:
        result += f'<option class="email-domain" value="{d}">{d}</option>'
    result += '</optgroup><span>V</span>'

    return mark_safe(result)