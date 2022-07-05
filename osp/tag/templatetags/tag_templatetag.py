from django import template

register = template.Library()
from django.utils.safestring import mark_safe
from tag.models import Tag

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
