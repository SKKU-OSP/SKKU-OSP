import re


def get_feedback_res(type, msg):
    return {
        'type': type,
        'message': msg
    }


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
    p = re.compile('^[a-zA-Z0-9+-_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
    print(email, p.match(email) != None)
    return p.match(email) == None
