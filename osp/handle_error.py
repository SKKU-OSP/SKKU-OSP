def get_missing_data_msg(name):
    return f" {name} 데이터는 필수입니다."


err_to_msg = {
    "require_login": "로그인이 필요합니다.",
    "user_not_found": "대상 유저를 찾을 수 없습니다.",
    "user_is_not_teammember": "유저가 팀 멤버가 아닙니다.",
    "user_already_teammember": "유저가 이미 팀 멤버입니다.",
    "access_denied": "접근할 수 없습니다.",
    "access_permission_denied": "접근 권한이 없습니다.",
    "missing_required_data": "필수 데이터가 없습니다.",
    "db_exception": "DB에 에러가 발생했습니다.",
    "undefined_exception": "정의되지 않은 오류가 발생했습니다.",
    "object_not_found": "데이터를 찾을 수 없습니다."
}


def get_fail_res(error_code: str, appended_msg=""):
    """ 
    fail Response 생성
    """
    msg = err_to_msg[error_code] if error_code in err_to_msg else ""
    return {
        'status': "fail",
        'message': msg + appended_msg,
        'data': None
    }
