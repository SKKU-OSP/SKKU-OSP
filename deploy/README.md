# 배포 가이드

## 디렉토리 구조

```
deploy/
├── dev/          # 개발서버 배포
│   └── docker-compose.yml
├── prod/         # 상용서버 배포
│   └── docker-compose.yml
└── README.md     # 이 파일
```

## 개발서버 배포

개발서버는 github runner를 통해 push 발생 시 최신 코드로 자동 빌드됩니다.

- 배포 상태 확인 : https://github.com/SKKU-OSP/SKKU-OSP/actions

```bash
cd deploy/dev
docker-compose down
docker-compose up -d --build
```

## 상용서버 배포

상용서버 배포는 두 가지 방식으로 수행할 수 있습니다.

### ① 수동 배포 (버전 명시 필요)

운영 서버에서는 반드시 **버전을 명시**하고 배포해야 합니다.

```bash
cd deploy/prod
docker-compose down
FRONTEND_VERSION=v1.0.8 BACKEND_VERSION=v1.0.8 docker-compose up -d --build
```

### ② 자동 배포 (릴리즈 기반)

- `main` 브랜치 기준으로 GitHub에서 릴리즈를 생성하고 **Publish** 하면,
- GitHub Actions self-hosted runner를 통해 운영 서버에 자동으로 배포됩니다.
- 이때 릴리즈 태그(`v1.0.8` 등)가 `FRONTEND_VERSION`, `BACKEND_VERSION`으로 자동 전달됩니다.

#### 자동 배포 흐름:

1. `develop` → `main` PR 머지
2. GitHub에서 릴리즈 생성 (`v1.0.8`)
3. 릴리즈 노트 수동 작성 후 `Publish`
4. 운영 서버에 자동 배포 실행

- 배포 상태 확인: https://github.com/SKKU-OSP/SKKU-OSP/actions
- 자동 배포는 오직 **main 브랜치 릴리즈**만 트리거됩니다.

## 서비스 확인

### 로그 확인

```bash
docker-compose logs -f [서비스명]
```

### 서비스 상태 확인

```bash
docker-compose ps
```

### 서비스 중단

```bash
docker-compose down
```

## 접속 정보

- **개발서버**: https://sosd-dev.skku.edu:8080 (VPN 필요)
- **상용서버**: https://sosd.skku.edu

## 주의사항

1. 상용서버 배포 시 반드시 버전을 명시하세요
2. 배포 전 백업을 확인하세요
3. 배포 후 서비스 정상 동작을 확인하세요
