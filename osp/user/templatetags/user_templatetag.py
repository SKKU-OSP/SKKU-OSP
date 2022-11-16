from django import template
from django.utils.safestring import mark_safe
from user.models import Account, StudentTab
from osp.settings import BASE_DIR
import os, json
DATA_DIR = os.path.join(BASE_DIR, "static/data/")
register = template.Library()

@register.simple_tag
def github_link(*args):
    link = "https://github.com/"
    for ele in args:
        link += ele
        link += "/"
    return link

@register.simple_tag
def tab_repo_type(request_type, tab_type):
    if request_type == tab_type:
        return "active"
    else:
        return ""

@register.simple_tag
def target_github_id(request):
    result = ''
    student = StudentTab.objects.values("github_id").all()

    for st in student:
        github_id = st['github_id']
        result += f'<option value="{github_id}">{github_id}</option>'
        
    return mark_safe(result)

@register.filter
def user_profile_image_url(user):
    if user.is_authenticated:
        acc = Account.objects.get(user=user)
        return mark_safe(acc.photo.url)
    else:
        return mark_safe(Account._meta.get_field('photo').get_default())

@register.simple_tag
def consent_text(request):
    try:
        with open(os.path.join(DATA_DIR, "consent.json"), 'r') as consent:
            data = json.load(consent)
    except:
        data = None
    if isinstance(data, list):
        for obj in data:
            obj["body"] = obj["body"].split("\n") 
        return data
    else:
        return [{"id":0,"title":"준비중", "body":["이 기능은 현재 준비 중입니다."]}]
