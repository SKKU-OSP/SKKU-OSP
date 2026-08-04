"""README 평가 서비스 — Spring ReadmeEvaluationService.java의 Python 포트."""
import logging
from typing import Optional

from repository.models import GithubRepository, GithubRepoAiEvaluation
from .readme_code_analyzer import (
    sanitize_readme,
    readability_detail,
    reproducibility_code_detail,
    analyze_visual,
    analyze_license,
)
from .readme_score_calculator import calculate_total, to_grade
from . import llm_client

logger = logging.getLogger(__name__)


def get_evaluation(github_username: str, repo_name: str) -> Optional[dict]:
    try:
        entity = GithubRepoAiEvaluation.objects.get(
            github_id=github_username, repo_name=repo_name
        )
        readme = GithubRepository.objects.filter(
            owner_name=github_username, repo_name=repo_name
        ).values_list('readme', flat=True).first()
        return _entity_to_dict(entity, readme)
    except GithubRepoAiEvaluation.DoesNotExist:
        return None


def evaluate(github_username: str, repo_name: str) -> dict:
    # 1. DB에서 README + license 조회
    try:
        repo = GithubRepository.objects.get(owner_name=github_username, repo_name=repo_name)
    except GithubRepository.DoesNotExist:
        raise ValueError(f"레포지토리를 찾을 수 없습니다: {github_username}/{repo_name}")

    if not repo.readme or not repo.readme.strip():
        raise ValueError(f"README가 없는 레포지토리입니다: {repo_name}")

    raw_readme = repo.readme
    injection_hits = llm_client.scan_injection(raw_readme)
    if injection_hits:
        logger.warning("README 인젝션 패턴 감지 (원문): %s/%s → %s", github_username, repo_name, injection_hits)
    sanitized_readme = sanitize_readme(raw_readme)

    # 2. 코드 판정 — 원문 사용 (구조 보존)
    r_detail = readability_detail(raw_readme)
    repro_detail = reproducibility_code_detail(raw_readme)
    visual = analyze_visual(raw_readme)
    lic = analyze_license(repo.license)

    readability = len(r_detail.good)
    reproducibility_code = len(repro_detail.good)

    logger.info("코드 판정 완료: %s/%s → readability=%d, visual=%d, repro_code=%d, license=%d",
                github_username, repo_name, readability, visual, reproducibility_code, lic)

    # 3. 코드 분석 결과 우선 저장 (LLM 실패 시 code_only로 착지)
    entity, _ = GithubRepoAiEvaluation.objects.get_or_create(
        github_id=github_username,
        repo_name=repo_name,
    )
    entity.readme_evaluation_status = 'code_only'
    entity.save(update_fields=['readme_evaluation_status', 'updated_at'])

    # 4. LLM 1차 호출: 채점 (temperature=0.0)
    logger.info("LLM 채점 시작: %s/%s", github_username, repo_name)
    try:
        score = llm_client.score_readme(repo_name, sanitized_readme, readability, visual, reproducibility_code, lic)
    except Exception as e:
        logger.error("LLM 채점 실패, code_only로 착지: %s/%s — %s", github_username, repo_name, e)
        return _entity_to_dict(entity, raw_readme)

    clarity = len(score.clarity.satisfied_subs)
    reproducibility_result = 1 if score.reproducibility_result.result == 'satisfied' else 0
    collaboration = 1 if score.collaboration.result == 'satisfied' else 0

    # 5. 재현성 세부 합산
    repro_good = list(repro_detail.good)
    repro_bad = list(repro_detail.bad)
    if reproducibility_result == 1:
        repro_good.append("실행 결과")
    else:
        repro_bad.append("실행 결과")

    # 6. 명확성 세부
    clarity_good = list(score.clarity.satisfied_subs)
    clarity_bad = list(score.clarity.unsatisfied_subs)

    # 7. 합산 및 등급
    total_score = calculate_total(
        clarity, readability, reproducibility_code, reproducibility_result,
        visual, lic, collaboration,
    )
    grade = to_grade(total_score)

    criteria_scores = {
        'clarity':                {'score': clarity,               'reason': score.clarity.reason},
        'readability':            {'score': readability,           'reason': '마크다운 구조 분석'},
        'reproducibility_code':   {'score': reproducibility_code, 'reason': '버전·의존성·실행명령어 정규식 분석'},
        'reproducibility_result': {'score': reproducibility_result,'reason': score.reproducibility_result.reason},
        'visual':                 {'score': visual,                'reason': '이미지 문법 분석'},
        'license':                {'score': lic,                   'reason': 'GitHub 라이선스 필드 확인'},
        'collaboration':          {'score': collaboration,         'reason': score.collaboration.reason},
    }

    entity.readme_score = grade
    entity.readme_total_score = total_score
    entity.readme_criteria_scores = criteria_scores
    entity.readme_missing_essentials = score.missing_essentials
    entity.readme_evaluation_status = 'partial'
    entity.save(update_fields=[
        'readme_score', 'readme_total_score', 'readme_criteria_scores',
        'readme_missing_essentials', 'readme_evaluation_status', 'updated_at',
    ])

    # 8. CoreCriterion / BonusItem 구조
    core_criteria = [
        {'label': '명확성', 'good': clarity_good, 'bad': clarity_bad},
        {'label': '재현성', 'good': repro_good,   'bad': repro_bad},
        {'label': '가독성', 'good': list(r_detail.good), 'bad': list(r_detail.bad)},
    ]
    bonus_items = [
        {'label': '시각 자료', 'satisfied': visual == 1},
        {'label': '라이선스',  'satisfied': lic == 1},
        {'label': '협업',      'satisfied': collaboration == 1},
    ]

    # 9. LLM 2차 호출: 문장화 (temperature=0.7)
    logger.info("LLM 문장화 시작: %s/%s", github_username, repo_name)
    try:
        sentences = llm_client.write_sentences(repo_name, sanitized_readme, core_criteria, bonus_items)
    except Exception as e:
        logger.error("LLM 문장화 실패, partial로 착지: %s/%s — %s", github_username, repo_name, e)
        return _entity_to_dict(entity, raw_readme)

    strengths = sentences.strengths or [
        "아직 강조할 만한 항목을 찾지 못했어요. 아래 보완할 점을 하나씩 채워가시면 좋겠습니다."
    ]
    improvements = sentences.improvements or [
        "모든 항목이 충실히 작성되어 현재 보완할 점은 없습니다. 훌륭합니다!"
    ]

    entity.readme_strengths = strengths
    entity.readme_improvements = improvements
    entity.readme_advice = sentences.advice or []
    entity.readme_evaluation_status = 'full'
    entity.save(update_fields=[
        'readme_strengths', 'readme_improvements', 'readme_advice',
        'readme_evaluation_status', 'updated_at',
    ])

    logger.info("README 평가 완료: %s/%s → grade=%s, total=%s", github_username, repo_name, grade, total_score)
    return _entity_to_dict(entity, raw_readme)


def _entity_to_dict(entity: GithubRepoAiEvaluation, readme: Optional[str]) -> dict:
    return {
        'evaluation_status': entity.readme_evaluation_status,
        'score': entity.readme_score,
        'total_score': entity.readme_total_score,
        'criteria_scores': entity.readme_criteria_scores,
        'missing_essentials': entity.readme_missing_essentials,
        'strengths': entity.readme_strengths,
        'improvements': entity.readme_improvements,
        'advice': entity.readme_advice,
        'updated_at': entity.updated_at.isoformat() if entity.updated_at else None,
        'readme': readme,
    }