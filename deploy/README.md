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
docker-compose up -d --build
```

## 상용서버 배포

상용서버는 반드시 배포 버전을 명시해야 합니다.

### 버전 지정 배포

```bash
cd deploy/prod
FRONTEND_VERSION=v1.0.8 BACKEND_VERSION=v1.0.8 docker-compose up -d --build
```

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

- **개발서버**: https://sosd-dev.skku.edu:8080
- **상용서버**: https://sosd.skku.edu

## 주의사항

1. 상용서버 배포 시 반드시 버전을 명시하세요
2. 배포 전 백업을 확인하세요
3. 배포 후 서비스 정상 동작을 확인하세요
