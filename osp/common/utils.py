import re
import os
import json
from osp.settings import BASE_DIR
CONTENTS_DIR = os.path.join(BASE_DIR, "static/contents/")


def get_fail_res(msg):
    """ 
    fail Response 생성
    """
    return {
        'status': "fail",
        'message': msg,
        'data': None
    }


def check_email(email):
    if email:
        p = re.compile('^[a-zA-Z0-9+-_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
        print(email, p.match(email) != None)
        return p.match(email) == None
    else:
        return False


def get_college_list():
    college_list = [
        "소프트웨어융합대학",
        "경영대학",
        "경제대학",
        "공과대학",
        "문과대학",
        "법과대학",
        "사범대학",
        "사회과학대학",
        "생명공학대학",
        "스포츠과학대학",
        "약학대학",
        "예술대학",
        "유학대학",
        "의학대학",
        "자연과학대학",
        "정보통신대학",
        "학부대학"]
    return college_list


def check_college(college):
    if college in get_college_list():
        return True
    return False


def get_consent_text(type):
    try:
        with open(os.path.join(CONTENTS_DIR, f"consent_{type}.json"), 'r') as consent:
            data = json.load(consent)
    except:
        data = None
    if isinstance(data, list):
        for obj in data:
            obj["body"] = obj["body"].split("\n")
        return data
    else:
        return [{"id": 0, "title": "준비중", "body": ["이 기능은 현재 준비 중입니다."]}]


def get_email_domains():
    email_domains = ["g.skku.edu", "skku.edu", "gmail.com",
                     "naver.com", "kakao.com", "nate.com", "yahoo.com"]
    return email_domains
