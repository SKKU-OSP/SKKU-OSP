import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

_QUIET_PATHS = {'/v2/ai-evaluation/pr-progress'}
_SENSITIVE_HEADERS = {'authorization', 'cookie', 'set-cookie'}


class SimpleMiddleware(MiddlewareMixin):
    def process_request(self, request):
        method = request.method
        path = request.get_full_path()
        # 짧은 주기로 호출되는 진행 상태 조회는 Django 기본 access log만 남긴다.
        if request.path in _QUIET_PATHS:
            return None

        headers = {
            key: '[REDACTED]' if key.lower() in _SENSITIVE_HEADERS else value
            for key, value in request.headers.items()
        }
        body = None

        # 바디 데이터는 장고의 HttpRequest 객체를 통해 원시 데이터로 직접 접근할 때 스트림을 소비하기 때문에
        # POST 또는 PUT 요청에 대해서만 로깅을 시도합니다.
        if method in ['POST', 'PUT']:
            # 요청 바디를 안전하게 읽기
            body = request.body

        # 요청 정보 로깅
        logger.info(
            f"Request method: {method}\nPath: {path}\nHeaders: {headers}\nBody: {body}")
        return None
