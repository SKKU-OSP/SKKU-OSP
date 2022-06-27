from django import template

register = template.Library()
import requests
from django.utils.safestring import mark_safe
from tag.models import Tag

@register.simple_tag
def category_tag(request):
        result = ''
        ##api 사용
        # host_uri = request.get_host()
        # r = requests.get('http://'+host_uri+'/tag/api')
        # if r.status_code == 200:
        #         d = r.json()
        #         data = d.get('data')
        #         print(data)
        #         for tag in data:
        #                 print(tag)
        #                 result += f'<option value="{tag}">{tag}</option>'
        tags = Tag.objects.all()
        type_list = list(tags.values_list("type", flat=True).distinct())
        type_list.remove('domain')

        for t in type_list:
            result += f'<optgroup label="{t}">'
            objects = Tag.objects.filter(type=t)
            name_list = list(objects.values_list("name", flat=True).distinct())
            name_list.sort()
            for n in name_list:
                    result += f'<option value="{n}">{n}</option>'
            result += '</optgroup>'

        return mark_safe(result)
