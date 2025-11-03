// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('api/admin/userstats', () => {
    return HttpResponse.json([
      {
        id: 'ababab',
        username: '이관우',
        github_id: 'gitid1',
        student_id: 2020314682,
        yearlyStats: {
          2025: {
            github_score: 4.4,
            repo_cnt: 19,
            commit_cnt: 132,
            commit_line: 69000,
            issue_cnt: 3,
            pr_cnt: 7
          },
          2024: {
            github_score: 2.1,
            repo_cnt: 19,
            commit_cnt: 62,
            commit_line: 24000,
            issue_cnt: 0,
            pr_cnt: 0
          }
        },
        repositories: [
          {
            id: 'repo1',
            name: 'os-xv6',
            description: '운영체제 과제용 xv6 리포지토리',
            stars: 125,
            forks: 34,
            commits: 208,
            pullRequests: 8,
            issues: 5,
            watchers: 42,
            languages: ['C', 'Assembly'],
            contributors: 5,
            createdAt: '2025-04-15',
            updatedAt: '2025-06-02'
          },
          {
            id: 'repo2',
            name: 'SKKU-OSP-Frontend',
            description: 'SSA SOSD 팀 프론트엔드 리포지토리',
            stars: 89,
            forks: 22,
            commits: 25,
            pullRequests: 5,
            issues: 3,
            watchers: 31,
            languages: ['JavaScript', 'React', 'CSS', 'HTML'],
            contributors: 3,
            createdAt: '2023-03-20',
            updatedAt: '2025-11-04'
          }
        ]
      },
      {
        id: 'cdcdcd',
        username: '강병희',
        github_id: 'gitid2',
        student_id: 2020319999,
        yearlyStats: {
          2025: {
            github_score: 3.8,
            repo_cnt: 25,
            commit_cnt: 262,
            commit_line: 123000,
            issue_cnt: 5,
            pr_cnt: 5
          },
          2024: {
            github_score: 5.0,
            repo_cnt: 25,
            commit_cnt: 372,
            commit_line: 363000,
            issue_cnt: 11,
            pr_cnt: 7
          }
        },
        repositories: [
          {
            id: 'repo3',
            name: 'python-utils',
            description: 'Utility functions for Python development',
            stars: 156,
            forks: 48,
            commits: 77,
            pullRequests: 12,
            issues: 8,
            watchers: 58,
            languages: ['Python'],
            contributors: 8,
            createdAt: '2022-11-10',
            updatedAt: '2024-11-01'
          }
        ]
      }
    ]);
  }),

  // 여기에 API 핸들러를 추가합니다
  // 예시: POST /api/v1/auth/login/sso/
  http.post('/api/v1/auth/login/sso/', async () => {
    // 로그인 성공 시나리오
    return HttpResponse.json({
      access_token: 'fake-access-token-12345',
      refresh_token: 'fake-refresh-token-67890',
      user: {
        pk: 10,
        username: 'sso_test_user',
        email: 'sso@example.com',
        github_id: 'test-sso-github'
      }
    });
  })

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
];
