
err_to_msg = {
    "require_login": "로그인이 필요합니다.",
    "user_not_found": "대상 유저를 찾을 수 없습니다.",
    "user_is_not_teammember": "유저가 팀 멤버가 아닙니다.",
    "user_already_teammember": "유저가 이미 팀 멤버입니다.",
    "access_denied": "접근할 수 없습니다.",
    "access_permission_denied": "접근 권한이 없습니다."
}


def get_fail_res(error_code: str):
    """ 
    fail Response 생성
    """
    msg = err_to_msg[error_code] if error_code in err_to_msg else ""
    return {
        'status': "fail",
        'message': msg,
        'data': None
    }
