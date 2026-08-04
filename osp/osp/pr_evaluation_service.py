"""PR 평가 서비스 — 루브릭 v2 (충실도 3점 + 명료성 1점 + 보너스 2점 = 6점 만점)."""
import logging
import re
from typing import Optional

from django.db import connection

from repository.models import GithubPulls, GithubPrAiEvaluation
from .readme_code_analyzer import sanitize_text
from . import llm_client

logger = logging.getLogger(__name__)

# ── PR 목록 조회 ──────────────────────────────────────────────────

def get_pr_list(github_username: str, repo_name: str) -> list:
    pulls = (
        GithubPulls.objects
        .filter(owner_id=github_username, repo_name=repo_name)
        .order_by('-date')
        .values('number', 'github_id', 'title', 'date')
    )
    return [
        {
            'pr_number': p['number'],
            'author': p['github_id'],
            'title': p['title'],
            'date': p['date'].isoformat() if p['date'] else None,
        }
        for p in pulls
    ]


# ── PR 본문 조회 ──────────────────────────────────────────────────

def _get_pr_body(github_username: str, repo_name: str, pr_number: int) -> Optional[str]:
    sql = """
        SELECT gpr.pr_body
        FROM github_pull_request gpr
        JOIN github_repository gr ON gpr.repo_id = gr.id
        WHERE gr.owner_name = %s
          AND gr.repo_name  = %s
          AND gpr.pr_number = %s
        LIMIT 1
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [github_username, repo_name, pr_number])
        row = cursor.fetchone()
    return row[0] if row else None


# ── 평가 조회 ─────────────────────────────────────────────────────

def get_evaluation(github_username: str, repo_name: str, pr_number: int) -> dict:
    pr_body = _get_pr_body(github_username, repo_name, pr_number)
    try:
        entity = GithubPrAiEvaluation.objects.get(
            github_id=github_username, repo_name=repo_name, pr_number=pr_number
        )
        return _entity_to_dict(entity, pr_body)
    except GithubPrAiEvaluation.DoesNotExist:
        return {'pr_body': pr_body, 'evaluated': False}


# ── 보너스 판정 (코드 정규식) ─────────────────────────────────────

_RE_ISSUE = re.compile(
    r'(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+\b'
    r'|(?:^|\s)#\d+\b'
    r'|github\.com/[\w.-]+/[\w.-]+/issues/\d+',
    re.IGNORECASE,
)
_RE_CODE_BLOCK = re.compile(r'```.*?```', re.DOTALL)
_RE_CONVENTION = re.compile(
    r'^(feat|fix|docs|refactor|test|chore|style|perf|ci|build|revert)(\(.+\))?:\s',
    re.IGNORECASE,
)
_RE_KR_CONVENTION = re.compile(r'^\[[^\]]+\]')
_RE_IMAGE = re.compile(r'!\[|<img', re.IGNORECASE)
_RE_CHECKLIST = re.compile(r'- \[[xX]\][ \t]*\S+')


def _has_substantial_code_block(body: str) -> bool:
    """비어있지 않은 줄이 2줄 이상인 코드블록이 있으면 True."""
    for m in _RE_CODE_BLOCK.finditer(body):
        inner = m.group(0)[3:-3]  # 앞뒤 ``` 제거
        non_empty = [l for l in inner.splitlines() if l.strip()]
        if len(non_empty) >= 2:
            return True
    return False


def _compute_bonus(pr_title: str, pr_body: str) -> tuple:
    """(bonus_score: float, earned_items: list[str]) 반환. 최대 2.0점."""
    title = pr_title or ''
    body = pr_body or ''
    # 코드 블록 내 #\d+ 오탐 방지
    body_no_code = _RE_CODE_BLOCK.sub('', body)
    full_text = title + ' ' + body_no_code

    bonus = 0.0
    earned = []

    if _RE_ISSUE.search(full_text):
        bonus += 1.0
        earned.append('이슈 연결')

    if _RE_CONVENTION.match(title) or _RE_KR_CONVENTION.match(title):
        bonus += 0.5
        earned.append('커밋 컨벤션')

    if _RE_IMAGE.search(body) or _has_substantial_code_block(body) or _RE_CHECKLIST.search(body):
        bonus += 0.5
        earned.append('리뷰 보조자료')

    return min(bonus, 2.0), earned


# ── 점수 계산 (코드) ──────────────────────────────────────────────

def _compute_fulfilment_score(f: llm_client.PrFulfilmentResult) -> int:
    """충실도 0~3점. What이 unsatisfied면 0점 고정."""
    if f.what != 'satisfied':
        return 0
    why_ok = f.why == 'satisfied'
    ver_ok = f.verification == 'satisfied'
    if why_ok and ver_ok:
        return 3
    if why_ok or ver_ok:
        return 2
    return 1


def _compute_clarity_score(c: llm_client.PrClarityResult) -> int:
    """명료성 0~1점. 판정 가능한 신호 중 하나라도 unsatisfied이면 0점.
    single_focus는 diff 없이 텍스트만으로 오판 가능성이 높아 점수에서 제외하고 조언 용도로만 사용.
    """
    signals = [c.title_specificity, c.title_body_match]
    judgeable = [s for s in signals if s != 'N/A']
    if not judgeable:
        logger.warning("명료성 신호 전부 N/A — title_specificity가 N/A로 반환된 LLM 오류 가능성. 0점 처리.")
        return 0
    return 1 if all(s == 'satisfied' for s in judgeable) else 0


def _to_grade(total: float) -> str:
    if total >= 5.0:
        return 'A+'
    if total >= 3.5:
        return 'A'
    if total >= 2.0:
        return 'B'
    if total >= 1.0:
        return 'C'
    return 'D'


# ── 문장화 입력 구성 ──────────────────────────────────────────────

_FULFILMENT_LABELS = {
    'what': '변경 내용(What)',
    'why': '변경 이유(Why)',
    'verification': '테스트·확인 방법',
}

_CLARITY_SCORE_LABELS = {
    'title_specificity': 'PR 제목 구체성',
    'title_body_match': '제목-본문 일치성',
}
_SINGLE_FOCUS_ADVICE = '단일 목적 집중(PR을 나누면 리뷰가 쉬워집니다)'


def _build_sentence_inputs(
    f: llm_client.PrFulfilmentResult,
    c: llm_client.PrClarityResult,
    bonus_earned: list,
    bonus_missing: list,
) -> tuple:
    """(good_items, bad_items) 반환."""
    good, bad = [], []

    for key, label in _FULFILMENT_LABELS.items():
        if getattr(f, key) == 'satisfied':
            good.append(label)
        else:
            bad.append(label)

    # 칭찬: 점수용 신호(제목 구체성/일치)가 하나라도 satisfied면 통합 1개
    if any(getattr(c, key) == 'satisfied' for key in _CLARITY_SCORE_LABELS):
        good.append('목적 명료성')
    # 개선점: 점수용 신호 unsatisfied는 개별
    for key, label in _CLARITY_SCORE_LABELS.items():
        if getattr(c, key) == 'unsatisfied':
            bad.append(label)
    # single_focus는 점수와 무관 — unsatisfied일 때만 조언으로
    if c.single_focus == 'unsatisfied':
        bad.append(_SINGLE_FOCUS_ADVICE)
    # N/A는 언급 안 함

    good.extend(bonus_earned)
    bad.extend(bonus_missing)

    return good, bad


# ── 평가 실행 ─────────────────────────────────────────────────────

def evaluate(github_username: str, repo_name: str, pr_number: int) -> dict:
    # 1. PR 기본 정보 조회
    pull = GithubPulls.objects.filter(
        owner_id=github_username, repo_name=repo_name, number=pr_number
    ).first()
    if not pull:
        raise ValueError(f"PR을 찾을 수 없습니다: {github_username}/{repo_name}#{pr_number}")

    raw_title = pull.title or ''
    raw_body = _get_pr_body(github_username, repo_name, pr_number) or ''
    injection_hits = llm_client.scan_injection(raw_title + '\n' + raw_body)
    if injection_hits:
        logger.warning("PR 인젝션 패턴 감지 (원문): %s/%s#%d → %s", github_username, repo_name, pr_number, injection_hits)
    pr_title = sanitize_text(raw_title, 'PR 제목')
    pr_body = sanitize_text(raw_body, 'PR 본문')
    body_present = bool(pr_body.strip())

    # 2. 보너스 판정 (코드)
    bonus_score, bonus_earned = _compute_bonus(pr_title, pr_body)
    all_bonus_labels = ['이슈 연결', '커밋 컨벤션', '리뷰 보조자료']
    bonus_missing = [b for b in all_bonus_labels if b not in bonus_earned]

    # 3. LLM 채점 (temperature 0.0)
    logger.info("LLM PR 채점 시작: %s/%s#%d (body_present=%s)", github_username, repo_name, pr_number, body_present)
    score = llm_client.score_pr(repo_name, pr_number, pr_title, pr_body, body_present)

    f = score.fulfilment
    c = score.clarity
    logger.info(
        "LLM 판정 결과 | 충실도 — what=%s, why=%s, verification=%s | "
        "명료성 — title_specificity=%s, title_body_match=%s, single_focus=%s",
        f.what, f.why, f.verification,
        c.title_specificity, c.title_body_match, c.single_focus,
    )

    fulfilment_score = _compute_fulfilment_score(score.fulfilment)
    clarity_score = _compute_clarity_score(score.clarity)

    # 보너스 게이팅: 충실도 0점(What도 미충족)이면 보너스 무효화
    if fulfilment_score == 0 and bonus_score > 0:
        logger.info(
            "보너스 게이팅 발동: %s/%s#%d — 충실도 0점으로 보너스 %.1f점 무효화",
            github_username, repo_name, pr_number, bonus_score,
        )
        bonus_score = 0.0
        bonus_missing = all_bonus_labels
        bonus_earned = []

    total = round(fulfilment_score + clarity_score + bonus_score, 1)
    grade = _to_grade(total)

    # 4. 문장화 입력 구성
    good_items, bad_items = _build_sentence_inputs(
        score.fulfilment, score.clarity, bonus_earned, bonus_missing
    )

    # 5. LLM 문장화 (temperature 0.7)
    logger.info("LLM PR 문장화 시작: %s/%s#%d", github_username, repo_name, pr_number)
    sentences = llm_client.write_pr_sentences(
        repo_name, pr_number, pr_title, pr_body, good_items, bad_items
    )

    strengths = (sentences.strengths or []) or [
        "아직 강조할 만한 항목을 찾지 못했어요. 아래 보완할 점을 참고해 주세요."
    ]
    improvements = (sentences.improvements or []) or [
        "모든 항목이 충실히 작성되어 현재 보완할 점은 없습니다. 훌륭합니다!"
    ]

    # 6. DB 저장
    entity, _ = GithubPrAiEvaluation.objects.get_or_create(
        github_id=github_username,
        repo_name=repo_name,
        pr_number=pr_number,
    )
    entity.pr_score = grade
    entity.pr_total_score = total
    entity.pr_breakdown = {
        'fulfilment': fulfilment_score,
        'clarity': clarity_score,
        'bonus': bonus_score,
        'bonus_earned': bonus_earned,
    }
    entity.pr_strengths = strengths
    entity.pr_improvements = improvements
    entity.pr_advice = sentences.advice or []
    entity.pr_missing = bad_items
    entity.save()

    logger.info(
        "PR 평가 완료: %s/%s#%d → %s (%.1f점 = 충실도%d + 명료성%d + 보너스%.1f)",
        github_username, repo_name, pr_number, grade, total,
        fulfilment_score, clarity_score, bonus_score,
    )
    return _entity_to_dict(entity, pr_body)


# ── dict 변환 ─────────────────────────────────────────────────────

def _entity_to_dict(entity: GithubPrAiEvaluation, pr_body: Optional[str] = None) -> dict:
    return {
        'evaluated': True,
        'pr_number': entity.pr_number,
        'pr_score': entity.pr_score,
        'pr_total_score': entity.pr_total_score,
        'pr_breakdown': entity.pr_breakdown,
        'pr_strengths': entity.pr_strengths,
        'pr_improvements': entity.pr_improvements,
        'pr_advice': entity.pr_advice,
        'updated_at': entity.updated_at.isoformat() if entity.updated_at else None,
        'pr_body': pr_body,
    }