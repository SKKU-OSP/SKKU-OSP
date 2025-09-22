// src/mocks/handlers.js
import { http, HttpResponse } from 'msw'

export const handlers = [
  
  // 여기에 API 핸들러를 추가합니다
  // 예시: POST /api/v1/auth/login/sso/
  http.post('/api/v1/auth/login/sso/', async () => {
    // 로그인 성공 시나리오
    return HttpResponse.json({
      "access_token": "fake-access-token-12345",
      "refresh_token": "fake-refresh-token-67890",
      "user": {
        "pk": 10,
        "username": "sso_test_user",
        "email": "sso@example.com",
        "github_id": "test-sso-github"
      }
    })
  }),

  // 로그인 실패 테스트 (위 핸들러를 주석 처리하고 아래 핸들러를 사용)
  /*
  http.post('/api/v1/auth/login/sso/', async () => {
    // 로그인 실패 시나리오 (401 Unauthorized)
    return new HttpResponse(null, {
      status: 401,
      statusText: 'Unauthorized',
    })
  }),
  */
]