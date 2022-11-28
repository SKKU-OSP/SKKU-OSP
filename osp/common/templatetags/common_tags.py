from django import template
from django.utils.safestring import mark_safe
from osp.settings import BASE_DIR
import os, json
DATA_DIR = os.path.join(BASE_DIR, "static/data/")
register = template.Library()

@register.simple_tag
def consent_text(request, type):
    try:
        with open(os.path.join(DATA_DIR, "consent_{}.json".format(type)), 'r') as consent:
            data = json.load(consent)
    except:
        data = None
    if isinstance(data, list):
        for obj in data:
            obj["body"] = obj["body"].split("\n") 
        return data
    else:
        return [{"id":0,"title":"준비중", "body":["이 기능은 현재 준비 중입니다."]}]
