"""
Spring → GitHub REST API 커밋 diff 조회 연동 테스트.

실행: cd SKKU-OSP/osp && python test_commit_diff_fetch.py
사전조건: Spring 서버가 실행 중이어야 합니다.
"""
import os
import sys
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'osp.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.conf import settings
from django.db import connection

SPRING_URL = settings.SPRING_BACKEND_URL


def sep(ch='-', n=60):
    print(ch * n)


def fetch_commit_diff(owner: str, repo: str, sha: str) -> dict:
    url = f"{SPRING_URL}/api/v1/github/commits/{owner}/{repo}/{sha}/diff"
    print(f"  GET {url}")
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    return resp.json()


def print_diff_summary(data: dict):
    files = data.get('files') or []
    print(f"  SHA    : {data.get('sha')}")
    print(f"  파일 수 : {len(files)}")
    for f in files[:5]:  # 최대 5개만 출력
        patch_lines = len((f.get('patch') or '').splitlines())
        print(f"    [{f.get('status', '?'):8}] {f.get('filename')}  "
              f"+{f.get('additions', 0)}/-{f.get('deletions', 0)}  ({patch_lines} patch lines)")
    if len(files) > 5:
        print(f"    ... 외 {len(files) - 5}개 파일")


# ══════════════════════════════════════════════════════════════════
# 1. DB에서 실제 커밋 샘플 조회
# ══════════════════════════════════════════════════════════════════

sep('=')
print("1. DB에서 테스트용 커밋 샘플 조회")
sep('=')

with connection.cursor() as cursor:
    cursor.execute("""
        SELECT gc.sha, gr.owner_name, gr.repo_name
        FROM github_commit gc
        JOIN github_repository gr ON gc.repo_id = gr.id
        WHERE gc.sha IS NOT NULL
          AND gr.owner_name IS NOT NULL
          AND gr.repo_name IS NOT NULL
        LIMIT 5
    """)
    samples = cursor.fetchall()

if not samples:
    print("DB에 커밋 데이터가 없습니다. SHA를 직접 입력하세요.")
    samples = []
else:
    for sha, owner, repo in samples:
        print(f"  {owner}/{repo}  {sha}")


# ══════════════════════════════════════════════════════════════════
# 2. Spring 서버 헬스체크
# ══════════════════════════════════════════════════════════════════

print()
sep('=')
print(f"2. Spring 헬스체크  ({SPRING_URL})")
sep('=')

try:
    resp = requests.get(f"{SPRING_URL}/api/v1/github/health", timeout=5)
    print(f"  상태: {resp.status_code}  응답: {resp.text.strip()}")
    spring_ok = resp.status_code == 200
except Exception as e:
    print(f"  연결 실패: {e}")
    spring_ok = False


# ══════════════════════════════════════════════════════════════════
# 3. diff 조회 테스트
# ══════════════════════════════════════════════════════════════════

print()
sep('=')
print("3. 커밋 diff 조회 테스트")
sep('=')

if not spring_ok:
    print("  Spring 서버에 연결할 수 없어 건너뜁니다.")
elif not samples:
    print("  DB 샘플이 없어 건너뜁니다.")
else:
    sha, owner, repo = samples[0]
    print(f"\n[테스트] {owner}/{repo}  {sha}")
    try:
        data = fetch_commit_diff(owner, repo, sha)
        print_diff_summary(data)

        # patch 내용 일부 출력 (첫 번째 파일)
        files = data.get('files') or []
        if files and files[0].get('patch'):
            patch_preview = '\n'.join(files[0]['patch'].splitlines()[:10])
            print(f"\n  [첫 번째 파일 patch 미리보기]\n{patch_preview}")
        print("\n  ✓ diff 조회 성공")
    except requests.HTTPError as e:
        print(f"  ✗ HTTP 오류: {e.response.status_code} {e.response.text[:200]}")
    except Exception as e:
        print(f"  ✗ 오류: {e}")

sep('=')
print("완료")
