from django import template

register = template.Library()
import requests
from django.utils.safestring import mark_safe

@register.simple_tag
def category_tag(request):
        result = ''
        host_uri = request.get_host()
        r = requests.get('http://'+host_uri+'/tag/api')
        if r.status_code == 200:
                d = r.json()
                data = d.get('data')
                print(data)
                for tag in data:
                        print(tag)
                        result += f'<option value="{tag}">{tag}</option>'

        return mark_safe(result)
