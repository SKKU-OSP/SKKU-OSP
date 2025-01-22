import logging
from rest_framework.response import Response
from rest_framework import status as http_status

def auth_validation(request, status, errors, username=None):
    user = request.user
    if not request.auth:
        errors["require_login"] = "로그인이 필요합니다."
        status = 'fail'
    elif (username!=None) and str(user) != username:
            errors["require_login"] = "잘못된 id에 대한 요청입니다."
            status = 'fail'
    return status, errors

def return_http_error_response(status, errors):
    http_error_status=None
    if "require_login" in errors:
        message = 'validation 과정 중 오류가 발생하였습니다.'
        logging.exception(
            f'validation error')
        res = {'status': status, 'message': message, 'errors': errors}
        http_error_status = http_status.HTTP_401_UNAUTHORIZED
    
    if http_error_status:
        return Response(res, status=http_error_status)
    else:
        return None