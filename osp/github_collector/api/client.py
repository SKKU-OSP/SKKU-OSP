import logging
from typing import Optional, Dict, Any, List, Generator
import requests

class GithubApiClient:
    BASE_URL = 'https://api.github.com'
    DEFAULT_TIMEOUT = 30

    def __init__(self, token: Optional[str] = None):
        """
        Github API 클라이언트 초기화

        Args:
            token: GitHub API 토큰 (선택적)
                - 비공개 레포 시 개인 토큰 사용
                - 토큰 미입력 시 비인증 요청으로 속도와 기능 제한 있음
        """
        self.token = token
        if not token:
            logging.warning("No token provided. Using default token.")
        self.session = self._create_session()

    def _create_session(self):
        session = requests.Session()
        session.headers.update({
            'Authorization': f'token {self.token}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GithubCollector'
        })
        return session
    

    def get_rate_limit(self) -> dict:
        """현재 Rate Limit 상태 확인"""
        response = self._request(
            method='GET',
            endpoint='/rate_limit'
        )
        return response.json()


    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = DEFAULT_TIMEOUT,
    ) -> requests.Response:
        """
        GitHub API 요청 수행

        Args:
            method: HTTP 메서드 (GET, POST, PUT, DELETE 등)
            endpoint: API 엔드포인트 경로 ('/repos/owner/repo/...')
            params: 쿼리 파라미터 (선택적)
            data: 요청 본문 데이터 (선택적)
            headers: 추가 헤더 (선택적)
            timeout: 요청 제한 시간 (선택적)

        Returns:
            requests.Response: API 응답 객체
        """

        if not headers:
            headers = {}

        headers.update(self.session.headers)
        
        logging.info(f"Sending {method} request to {endpoint}")
        
        try:
            response = self.session.request(
                method=method,
                url=f'{self.BASE_URL}{endpoint}',
                params=params,
                json=data,
                headers=headers,
                timeout=timeout
            )

            if endpoint != "/rate_limit":
                remaining = response.headers.get("X-RateLimit-Remaining")
                limit = response.headers.get("X-RateLimit-Limit")
                reset = response.headers.get("X-RateLimit-Reset")
                logging.info(f"Rate limit: {remaining}/{limit}, resets at {reset}")

            response.raise_for_status()

            return response

        except requests.exceptions.RequestException as e:
            logging.error(f"Request failed: {e}")
            raise


    def _paginate(self,
                  endpoint: str,
                  params: Optional[Dict[str, Any]] = None,
                  per_page: int = 100,
                  page: int = 1,
                  headers: Optional[Dict[str, str]] = None,
                  ) -> Generator[Dict[str, Any], None, None]:
        """
        페이지네이션 처리 후 yeild를 통해 각 페이지 아이템 반환

        Args:
            endpoint: API 엔드포인트 경로 ('/repos/owner/repo/...')
            params: 쿼리 파라미터 (선택적)
            per_page: 페이지당 아이템 수
            page: 시작 페이지 번호

        Returns:
            Generator[Dict[str, Any], None, None]: 모든 페이지의 아이템 목록
        """
        if params is None:
            params = {}
        
        params['per_page'] = per_page
        params['page'] = page
        
        while True:
            response = self._request('GET', endpoint, params=params, headers=headers)

            data = response.json()

            if isinstance(data, dict) and 'items' in data:
                items = data['items']
            else:
                items = data

            if not items:
                break

            for item in items:
                yield item
                
            if len(items) < params['per_page']:
                break
                
            params['page'] += 1
        