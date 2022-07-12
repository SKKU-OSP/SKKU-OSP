from django import template
from django.utils.safestring import mark_safe
from user.models import StudentTab
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
