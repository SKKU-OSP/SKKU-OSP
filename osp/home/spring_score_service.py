"""
Spring Backend에서 계산된 점수를 가져오는 서비스

이 서비스는 Spring Boot 백엔드의 점수 계산 API를 호출하여
OSP의 GithubScore 테이블에 저장합니다.
"""
import requests
import logging
from typing import Optional, Dict, Any

from django.conf import settings
from django.db import transaction

from user.models import Account, GithubScore, GitHubScoreTable

logger = logging.getLogger(__name__)


class SpringScoreService:
    """Spring Backend 점수 API 클라이언트"""

    def __init__(self):
        # settings.py에서 Spring 서버 URL 가져오기
        self.base_url = getattr(settings, 'SPRING_BACKEND_URL', 'http://localhost:8080')
        self.timeout = getattr(settings, 'SPRING_API_TIMEOUT', 30)

    def fetch_score(self, github_username: str, student_id: str, year: int) -> Optional[Dict[str, Any]]:
        """
        Spring API에서 점수 데이터를 가져옵니다.

        Args:
            github_username: GitHub 로그인 ID (문자열, 예: "kdy1")
            student_id: 학번
            year: 연도

        Returns:
            점수 데이터 딕셔너리 또는 None
        """
        url = f"{self.base_url}/api/v1/github/scores"
        params = {
            "githubUsername": github_username,  # GitHub 로그인 ID 사용
            "studentId": student_id,
            "year": year
        }

        try:
            logger.info(f"Spring API 호출: {url} params={params}")
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()

            data = response.json()

            if data.get("success") and data.get("data"):
                score_data = data["data"][0]
                logger.info(f"점수 조회 성공: github_username={github_username}, year={year}, total_score={score_data.get('totalScore')}")
                return score_data
            else:
                logger.warning(f"점수 데이터 없음: github_username={github_username}, year={year}, message={data.get('message')}")
                return None

        except requests.Timeout:
            logger.error(f"Spring API 타임아웃: github_username={github_username}, year={year}")
            return None
        except requests.RequestException as e:
            logger.error(f"Spring API 호출 실패: github_username={github_username}, year={year}, error={e}")
            return None
        except Exception as e:
            logger.error(f"예상치 못한 오류: github_username={github_username}, year={year}, error={e}")
            return None

    @transaction.atomic
    def sync_user_score(self, user: Account, year: int) -> bool:
        """
        Spring에서 점수를 가져와 OSP DB에 저장합니다.

        Args:
            user: Account 객체
            year: 연도

        Returns:
            성공 여부
        """
        # 사용자 정보 추출
        github_username = user.student_data.github_id  # GitHub 로그인 ID (문자열)
        student_id = str(user.student_data.id)  # 학번

        # Spring API 호출 (githubUsername 사용)
        score_data = self.fetch_score(github_username, student_id, year)

        if not score_data:
            logger.warning(f"점수 동기화 실패 (데이터 없음): user={user}, year={year}")
            return False

        try:
            # GithubScore 저장/업데이트
            self._save_github_score(github_username, year, score_data)

            # GitHubScoreTable 저장/업데이트
            self._save_score_table(user, year, score_data)

            logger.info(f"점수 동기화 완료: user={user}, year={year}")
            return True

        except Exception as e:
            logger.error(f"점수 저장 실패: user={user}, year={year}, error={e}")
            return False

    def _save_github_score(self, github_id: str, year: int, score_data: Dict[str, Any]) -> None:
        """GithubScore 모델에 점수 저장"""
        yid = f"{year}{github_id}"

        # 기존 레코드 조회 또는 생성
        github_score, created = GithubScore.objects.get_or_create(
            yid=yid,
            defaults={
                'github_id': github_id,
                'year': year,
                'excellent_contributor': 0,
                'best_repo': score_data.get('bestRepo', ''),
                'guideline_score': score_data.get('guidelineScore', 0.0),
                'code_score': 0.0,
                'other_project_score': 0.0,
                'contributor_score': 0.0,
                'star_score': score_data.get('scoreStar', 0.0),
                'contribution_score': score_data.get('totalScore', 0.0),
                'star_count': 0,
                'commit_count': score_data.get('commitCount', 0),
                'pr_count': score_data.get('prCount', 0),
                'issue_count': score_data.get('issueCount', 0),
                'star_owner_count': 0,
                'fork_owner_count': 0,
                'score_10000L_sub': score_data.get('commitLineScore', 0.0),
                'score_10000L_add': score_data.get('commitLineScore', 0.0),
                'score_10000L_sum': score_data.get('commitLineScore', 0.0),
                'score_50C': score_data.get('commitCntScore', 0.0),
                'score_pr_issue': score_data.get('pullNIssueScore', 0.0),
                'guideline_score_v2': score_data.get('guidelineScore', 0.0),
                'repo_score_sub': score_data.get('repoScoreSum', 0.0),
                'repo_score_add': score_data.get('repoScoreSum', 0.0),
                'repo_score_sum': score_data.get('repoScoreSum', 0.0),
                'score_star': score_data.get('scoreStar', 0.0),
                'score_fork': score_data.get('scoreFork', 0.0),
                'score_other_repo_sub': score_data.get('scoreOtherRepoSum', 0.0),
                'score_other_repo_add': score_data.get('scoreOtherRepoSum', 0.0),
                'score_other_repo_sum': score_data.get('scoreOtherRepoSum', 0.0),
                'additional_score_sub': 0.0,
                'additional_score_add': 0.0,
                'additional_score_sum': 0.0,
            }
        )

        if not created:
            # 기존 레코드 업데이트
            github_score.best_repo = score_data.get('bestRepo', '')
            github_score.guideline_score = score_data.get('guidelineScore', 0.0)
            github_score.star_score = score_data.get('scoreStar', 0.0)
            github_score.contribution_score = score_data.get('totalScore', 0.0)
            github_score.commit_count = score_data.get('commitCount', 0)
            github_score.pr_count = score_data.get('prCount', 0)
            github_score.issue_count = score_data.get('issueCount', 0)
            github_score.score_10000L_sub = score_data.get('commitLineScore', 0.0)
            github_score.score_10000L_add = score_data.get('commitLineScore', 0.0)
            github_score.score_10000L_sum = score_data.get('commitLineScore', 0.0)
            github_score.score_50C = score_data.get('commitCntScore', 0.0)
            github_score.score_pr_issue = score_data.get('pullNIssueScore', 0.0)
            github_score.guideline_score_v2 = score_data.get('guidelineScore', 0.0)
            github_score.repo_score_sub = score_data.get('repoScoreSum', 0.0)
            github_score.repo_score_add = score_data.get('repoScoreSum', 0.0)
            github_score.repo_score_sum = score_data.get('repoScoreSum', 0.0)
            github_score.score_star = score_data.get('scoreStar', 0.0)
            github_score.score_fork = score_data.get('scoreFork', 0.0)
            github_score.score_other_repo_sub = score_data.get('scoreOtherRepoSum', 0.0)
            github_score.score_other_repo_add = score_data.get('scoreOtherRepoSum', 0.0)
            github_score.score_other_repo_sum = score_data.get('scoreOtherRepoSum', 0.0)
            github_score.save()

    def _save_score_table(self, user: Account, year: int, score_data: Dict[str, Any]) -> None:
        """GitHubScoreTable 모델에 점수 저장"""
        total_score = score_data.get('totalScore', 0.0)

        score_table, created = GitHubScoreTable.objects.get_or_create(
            id=user.student_data.id,
            year=year,
            defaults={
                'name': user.student_data.name,
                'github_id': user.student_data.github_id,
                'total_score': total_score,
                'commit_cnt': score_data.get('commitCount', 0),
                'commit_line': score_data.get('totalAddition', 0),
                'issue_cnt': score_data.get('issueCount', 0),
                'pr_cnt': score_data.get('prCount', 0),
                'repo_cnt': 0,
                'dept': user.student_data.dept,
                'absence': user.student_data.absence,
                'plural_major': user.student_data.plural_major,
                'personal_email': user.student_data.personal_email,
            }
        )

        if not created:
            score_table.total_score = total_score
            score_table.commit_cnt = score_data.get('commitCount', 0)
            score_table.commit_line = score_data.get('totalAddition', 0)
            score_table.issue_cnt = score_data.get('issueCount', 0)
            score_table.pr_cnt = score_data.get('prCount', 0)
            score_table.save()


# 편의 함수
def spring_score_update(user: Account, year: int) -> bool:
    """
    Spring Backend에서 점수를 가져와 업데이트합니다.

    기존 user_score_update 함수를 대체합니다.

    Args:
        user: Account 객체
        year: 연도

    Returns:
        성공 여부
    """
    service = SpringScoreService()
    return service.sync_user_score(user, year)
