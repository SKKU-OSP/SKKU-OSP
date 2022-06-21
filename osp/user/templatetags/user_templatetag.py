from django import template

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