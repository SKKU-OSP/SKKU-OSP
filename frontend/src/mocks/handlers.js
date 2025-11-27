// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('api/admin/userstats', () => {
    return HttpResponse.json([
      {
        id: 'ababab',
        name: '이관우',
        username: 'curamy',
        github_id: 'Curamy',
        student_id: 2020314682,
        yearlyStats: {
          2025: {
            github_score: 4.42,
            repo_cnt: 19,
            commit_cnt: 132,
            add_line: 58000,
            del_line: 11000,
            issue_cnt: 3,
            pr_cnt: 7
          },
          2024: {
            github_score: 2.61,
            repo_cnt: 19,
            commit_cnt: 62,
            add_line: 20000,
            del_line: 4000,
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
            add_lines: 24000,
            del_lines: 4200,
            pullRequests: 8,
            issues: 5,
            user_commits: 42,
            user_add_lines: 13500,
            user_del_lines: 3250,
            user_PRs: 2,
            user_issues: 1,
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
            add_lines: 3000,
            del_lines: 1200,
            pullRequests: 5,
            issues: 3,
            user_commits: 15,
            user_add_lines: 2100,
            user_del_lines: 800,
            user_PRs: 4,
            user_issues: 2,
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
        name: '강병희',
        username: 'byungKHee',
        github_id: 'byungKHee',
        student_id: 2020319999,
        yearlyStats: {
          2025: {
            github_score: 3.87,
            repo_cnt: 25,
            commit_cnt: 262,
            add_line: 1750432,
            del_line: 180400,
            issue_cnt: 5,
            pr_cnt: 5
          },
          2024: {
            github_score: 5.0,
            repo_cnt: 25,
            commit_cnt: 372,
            add_line: 25316942,
            del_line: 5301100,
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
            add_lines: 7700,
            del_lines: 1500,
            pullRequests: 12,
            issues: 8,
            user_commits: 60,
            user_add_lines: 6500,
            user_del_lines: 1300,
            user_PRs: 8,
            user_issues: 5,
            watchers: 58,
            languages: ['Python'],
            contributors: 8,
            createdAt: '2022-11-10',
            updatedAt: '2024-11-01'
          }
        ]
      },
      {
        id: 'efefef',
        name: '김기태',
        username: 'kitae',
        github_id: 'kitae-kim',
        student_id: 2023310001,
        yearlyStats: {
          2025: {
            // 이 사용자는 2025년 데이터만 있음
            github_score: 3.9,
            repo_cnt: 12,
            commit_cnt: 180,
            add_line: 48000,
            del_line: 7000,
            issue_cnt: 8,
            pr_cnt: 12
          }
        },
        repositories: [
          {
            id: 'repo4',
            name: 'unity-game-project',
            description: 'A 2D platformer game built with Unity',
            stars: 45,
            forks: 10,
            commits: 120,
            add_lines: 18000,
            del_lines: 5400,
            pullRequests: 8,
            issues: 3,
            user_commits: 95,
            user_add_lines: 14400,
            user_del_lines: 4300,
            user_PRs: 7,
            user_issues: 3,
            watchers: 12,
            languages: ['C#', 'Unity'],
            contributors: 3,
            createdAt: '2025-03-01',
            updatedAt: '2025-10-28'
          },
          {
            id: 'repo5',
            name: 'algorithm-ps',
            description: 'My solutions for Baekjoon Online Judge',
            stars: 78,
            forks: 30,
            commits: 350,
            add_lines: 28000,
            del_lines: 4200,
            pullRequests: 2,
            issues: 0,
            user_commits: 350,
            user_add_lines: 26600,
            user_del_lines: 4000,
            user_PRs: 2,
            user_issues: 0,
            watchers: 25,
            languages: ['Python', 'C++'],
            contributors: 1,
            createdAt: '2025-01-10',
            updatedAt: '2025-11-05'
          },
          {
            id: 'repo6',
            name: 'team-portfolio-web',
            description: 'Portfolio website for our team project',
            stars: 20,
            forks: 5,
            commits: 88,
            add_lines: 17600,
            del_lines: 8800,
            pullRequests: 15,
            issues: 5,
            user_commits: 22,
            user_add_lines: 5300,
            user_del_lines: 2600,
            user_PRs: 8,
            user_issues: 2,
            watchers: 8,
            languages: ['React', 'TypeScript', 'Styled-components'],
            contributors: 4,
            createdAt: '2025-05-20',
            updatedAt: '2025-09-15'
          }
        ]
      },
      {
        id: 'ghghgh',
        name: '박성균',
        username: 'park',
        github_id: 'sungkyun-park',
        student_id: 2021310022,
        yearlyStats: {
          2024: {
            github_score: 2.5,
            repo_cnt: 8,
            commit_cnt: 90,
            add_line: 15000,
            del_line: 3000,
            issue_cnt: 1,
            pr_cnt: 2
          },
          2025: {
            github_score: 4.1,
            repo_cnt: 15,
            commit_cnt: 210,
            add_line: 70000,
            del_line: 12000,
            issue_cnt: 4,
            pr_cnt: 9
          }
        },
        repositories: [
          {
            id: 'repo7',
            name: 'data-analysis-notebooks',
            description: 'Jupyter notebooks for data analysis class',
            stars: 15,
            forks: 3,
            commits: 45,
            add_lines: 4500,
            del_lines: 900,
            pullRequests: 0,
            issues: 0,
            user_commits: 45,
            user_add_lines: 4300,
            user_del_lines: 850,
            user_PRs: 0,
            user_issues: 0,
            watchers: 6,
            languages: ['Jupyter Notebook', 'Python', 'Pandas'],
            contributors: 1,
            createdAt: '2024-02-15',
            updatedAt: '2024-12-01'
          },
          {
            id: 'repo8',
            name: 'django-backend-api',
            description: 'Backend server for a web service',
            stars: 60,
            forks: 15,
            commits: 230,
            add_lines: 30000,
            del_lines: 9000,
            pullRequests: 12,
            issues: 7,
            user_commits: 110,
            user_add_lines: 15000,
            user_del_lines: 4500,
            user_PRs: 6,
            user_issues: 3,
            watchers: 18,
            languages: ['Python', 'Django', 'DRF'],
            contributors: 4,
            createdAt: '2024-07-01',
            updatedAt: '2025-11-01'
          },
          {
            id: 'repo9',
            name: 'sungkyun-park.github.io',
            description: 'My personal blog and portfolio',
            stars: 33,
            forks: 8,
            commits: 70,
            add_lines: 11200,
            del_lines: 2800,
            pullRequests: 1,
            issues: 1,
            user_commits: 70,
            user_add_lines: 10600,
            user_del_lines: 2700,
            user_PRs: 1,
            user_issues: 1,
            watchers: 10,
            languages: ['HTML', 'CSS', 'JavaScript'],
            contributors: 1,
            createdAt: '2024-01-05',
            updatedAt: '2025-10-30'
          },
          {
            id: 'repo10',
            name: 'capstone-design-project',
            description: 'Graduation capstone design project',
            stars: 102,
            forks: 25,
            commits: 400,
            add_lines: 72000,
            del_lines: 28800,
            pullRequests: 22,
            issues: 10,
            user_commits: 100,
            user_add_lines: 14400,
            user_del_lines: 5800,
            user_PRs: 8,
            user_issues: 3,
            watchers: 30,
            languages: ['Java', 'Spring Boot', 'React'],
            contributors: 5,
            createdAt: '2025-03-10',
            updatedAt: '2025-11-04'
          }
        ]
      },
      {
        id: 'ijijij',
        name: '장수지',
        username: 'siuuuu',
        github_id: 'suji-jang',
        student_id: 2020310033,
        yearlyStats: {
          2023: {
            github_score: 3.1,
            repo_cnt: 5,
            commit_cnt: 150,
            add_line: 22000,
            del_line: 3000,
            issue_cnt: 2,
            pr_cnt: 5
          },
          2024: {
            github_score: 3.8,
            repo_cnt: 9,
            commit_cnt: 220,
            add_line: 50000,
            del_line: 10000,
            issue_cnt: 5,
            pr_cnt: 10
          },
          2025: {
            github_score: 4.5,
            repo_cnt: 14,
            commit_cnt: 310,
            add_line: 95000,
            del_line: 15000,
            issue_cnt: 8,
            pr_cnt: 15
          }
        },
        repositories: [
          {
            id: 'repo11',
            name: 'ml-prediction-model',
            description: 'Stock price prediction model using TensorFlow',
            stars: 180,
            forks: 55,
            commits: 280,
            add_lines: 31000,
            del_lines: 9300,
            pullRequests: 10,
            issues: 8,
            user_commits: 140,
            user_add_lines: 18600,
            user_del_lines: 5600,
            user_PRs: 7,
            user_issues: 4,
            watchers: 60,
            languages: ['Python', 'TensorFlow', 'Keras'],
            contributors: 2,
            createdAt: '2023-09-01',
            updatedAt: '2025-10-15'
          },
          {
            id: 'repo12',
            name: 'ios-diary-app',
            description: 'A simple diary application for iOS',
            stars: 95,
            forks: 20,
            commits: 160,
            add_lines: 14400,
            del_lines: 2900,
            pullRequests: 18,
            issues: 6,
            user_commits: 160,
            user_add_lines: 13700,
            user_del_lines: 2800,
            user_PRs: 18,
            user_issues: 6,
            watchers: 22,
            languages: ['Swift', 'SwiftUI'],
            contributors: 1,
            createdAt: '2024-04-20',
            updatedAt: '2025-08-30'
          },
          {
            id: 'repo13',
            name: 'suji-design-system',
            description: 'Personal design system components',
            stars: 40,
            forks: 7,
            commits: 90,
            add_lines: 11700,
            del_lines: 2900,
            pullRequests: 5,
            issues: 2,
            user_commits: 90,
            user_add_lines: 11500,
            user_del_lines: 2800,
            user_PRs: 5,
            user_issues: 2,
            watchers: 11,
            languages: ['TypeScript', 'Storybook', 'React'],
            contributors: 1,
            createdAt: '2025-02-01',
            updatedAt: '2025-09-01'
          }
        ]
      },
      {
        id: 'klklkl',
        name: '홍길동',
        username: 'HongGD',
        github_id: 'gildong-hong',
        student_id: 2022310044,
        yearlyStats: {
          2024: {
            github_score: 1.8,
            repo_cnt: 4,
            commit_cnt: 70,
            add_line: 7500,
            del_line: 1500,
            issue_cnt: 0,
            pr_cnt: 1
          },
          2025: {
            github_score: 2.9,
            repo_cnt: 8,
            commit_cnt: 140,
            add_line: 26000,
            del_line: 5000,
            issue_cnt: 2,
            pr_cnt: 3
          }
        },
        repositories: [
          {
            id: 'repo14',
            name: 'web-security-scanner',
            description: 'A simple XSS scanner tool',
            stars: 30,
            forks: 10,
            commits: 65,
            add_lines: 6500,
            del_lines: 1300,
            pullRequests: 2,
            issues: 1,
            user_commits: 65,
            user_add_lines: 6000,
            user_del_lines: 1200,
            user_PRs: 2,
            user_issues: 1,
            watchers: 9,
            languages: ['Go', 'Python'],
            contributors: 1,
            createdAt: '2024-06-11',
            updatedAt: '2025-02-10'
          },
          {
            id: 'repo15',
            name: 'raspberry-pi-iot',
            description: 'IoT project using Raspberry Pi and sensors',
            stars: 55,
            forks: 20,
            commits: 110,
            add_lines: 13200,
            del_lines: 4000,
            pullRequests: 4,
            issues: 3,
            user_commits: 40,
            user_add_lines: 5300,
            user_del_lines: 1600,
            user_PRs: 2,
            user_issues: 1,
            watchers: 14,
            languages: ['C', 'Python', 'Shell'],
            contributors: 3,
            createdAt: '2024-10-01',
            updatedAt: '2025-09-20'
          },
          {
            id: 'repo16',
            name: 'simple-chat-app',
            description: 'Real-time chat application with Node.js and Socket.io',
            stars: 68,
            forks: 15,
            commits: 90,
            add_lines: 13500,
            del_lines: 4700,
            pullRequests: 8,
            issues: 4,
            user_commits: 45,
            user_add_lines: 7400,
            user_del_lines: 2600,
            user_PRs: 5,
            user_issues: 2,
            watchers: 16,
            languages: ['Node.js', 'Socket.io', 'JavaScript'],
            contributors: 2,
            createdAt: '2025-04-05',
            updatedAt: '2025-10-25'
          },
          {
            id: 'repo17',
            name: 'project-docs',
            description: 'Documentation for various projects',
            stars: 10,
            forks: 2,
            commits: 30,
            add_lines: 1500,
            del_lines: 150,
            pullRequests: 0,
            issues: 0,
            user_commits: 30,
            user_add_lines: 1350,
            user_del_lines: 140,
            user_PRs: 0,
            user_issues: 0,
            watchers: 3,
            languages: ['Markdown'],
            contributors: 1,
            createdAt: '2025-01-30',
            updatedAt: '2025-08-05'
          }
        ]
      },
      {
        id: 'mnmnmn',
        name: '김율전',
        username: 'yulbung',
        github_id: 'yuljeon-kim',
        student_id: 2021310055,
        yearlyStats: {
          2023: {
            github_score: 2.2,
            repo_cnt: 3,
            commit_cnt: 80,
            add_line: 12000,
            del_line: 3000,
            issue_cnt: 1,
            pr_cnt: 3
          },
          2024: {
            github_score: 3.3,
            repo_cnt: 6,
            commit_cnt: 160,
            add_line: 38000,
            del_line: 7000,
            issue_cnt: 3,
            pr_cnt: 8
          },
          2025: {
            github_score: 3.7,
            repo_cnt: 10,
            commit_cnt: 200,
            add_line: 60000,
            del_line: 10000,
            issue_cnt: 5,
            pr_cnt: 10
          }
        },
        repositories: [
          {
            id: 'repo18',
            name: 'aws-infra-terraform',
            description: 'Infrastructure as Code for AWS using Terraform',
            stars: 70,
            forks: 25,
            commits: 120,
            add_lines: 16800,
            del_lines: 3400,
            pullRequests: 10,
            issues: 4,
            user_commits: 70,
            user_add_lines: 10900,
            user_del_lines: 2200,
            user_PRs: 6,
            user_issues: 2,
            watchers: 20,
            languages: ['HCL', 'Terraform'],
            contributors: 2,
            createdAt: '2023-11-05',
            updatedAt: '2025-10-10'
          },
          {
            id: 'repo19',
            name: 'kubernetes-cluster-setup',
            description: 'Scripts and manifests for setting up a K8s cluster',
            stars: 85,
            forks: 30,
            commits: 150,
            add_lines: 15000,
            del_lines: 4500,
            pullRequests: 12,
            issues: 6,
            user_commits: 50,
            user_add_lines: 4500,
            user_del_lines: 1400,
            user_PRs: 4,
            user_issues: 2,
            watchers: 28,
            languages: ['Shell', 'YAML', 'Dockerfile'],
            contributors: 3,
            createdAt: '2024-08-15',
            updatedAt: '2025-11-03'
          },
          {
            id: 'repo20',
            name: 'fastapi-microservice',
            description: 'A high-performance microservice using FastAPI',
            stars: 110,
            forks: 18,
            commits: 95,
            add_lines: 17100,
            del_lines: 6800,
            pullRequests: 7,
            issues: 2,
            user_commits: 55,
            user_add_lines: 10300,
            user_del_lines: 4100,
            user_PRs: 5,
            user_issues: 1,
            watchers: 35,
            languages: ['Python', 'FastAPI'],
            contributors: 2,
            createdAt: '2025-07-01',
            updatedAt: '2025-11-02'
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
