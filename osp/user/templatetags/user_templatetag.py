from django import template
from django.utils.safestring import mark_safe
from user.models import Account, StudentTab
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
