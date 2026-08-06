"""이슈 평가 서비스 — 충실도 3점 + 명료성 1점 + 보너스 2점 = 6점 만점 (PR 평가와 동일 뼈대)."""
import logging
import re
from typing import Optional

from django.db import connection

from repository.models import GithubIssues, GithubIssueAiEvaluation
from .readme_code_analyzer import sanitize_text
from . import llm_client

logger = logging.getLogger(__name__)


# ── 이슈 목록 조회 ────────────────────────────────────────────────

def get_issue_list(github_username: str, repo_name: str) -> list:
    issues = (
        GithubIssues.objects
        .filter(owner_id=github_username, repo_name=repo_name)
        .order_by('-date')
        .values('number', 'github_id', 'title', 'date')
    )
    return [
        {
            'issue_number': i['number'],
            'author': i['github_id'],
            'title': i['title'],
            'date': i['date'].isoformat() if i['date'] else None,
        }
        for i in issues
    ]


# ── 이슈 본문 조회 (raw SQL) ──────────────────────────────────────

def _get_issue_body(github_username: str, repo_name: str, issue_number: int) -> Optional[str]:
    sql = """
        SELECT gi.issue_body
        FROM github_issue gi
        JOIN github_repository gr ON gi.repo_id = gr.id
        WHERE gr.owner_name = %s
          AND gr.repo_name  = %s
          AND gi.issue_number = %s
        LIMIT 1
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, [github_username, repo_name, issue_number])
        row = cursor.fetchone()
    return row[0] if row else None


# ── 평가 조회 ─────────────────────────────────────────────────────

def get_evaluation(github_username: str, repo_name: str, issue_number: int) -> dict:
    issue_body = _get_issue_body(github_username, repo_name, issue_number)
    try:
        entity = GithubIssueAiEvaluation.objects.get(
            github_id=github_username, repo_name=repo_name, issue_number=issue_number
        )
        return _entity_to_dict(entity, issue_body)
    except GithubIssueAiEvaluation.DoesNotExist:
        return {'issue_body': issue_body, 'evaluated': False}
    except Exception as e:
        logger.warning("이슈 평가 조회 실패 (테이블 미존재 등): %s", e)
        return {'issue_body': issue_body, 'evaluated': False}


# ── 보너스 판정 (코드) ────────────────────────────────────────────

_RE_CODE_BLOCK = re.compile(r'```.*?```', re.DOTALL)
_RE_IMAGE = re.compile(r'!\[|<img', re.IGNORECASE)
_RE_ISSUE_LINK = re.compile(
    r'(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+\b'
    r'|(?:^|\s)#\d+\b'
    r'|github\.com/[\w.-]+/[\w.-]+/(?:issues|pull)/\d+',
    re.IGNORECASE | re.MULTILINE,
)
_RE_TITLE_TAG = re.compile(
    r'^\[(?:Bug|버그|Feature|기능|Feat|Fix|bug|feature|feat|fix)\b',
    re.IGNORECASE,
)
_RE_COLON_CONVENTION = re.compile(
    r'^(feat|fix|docs|refactor|test|chore|style|perf|ci|build|revert)(\(.+\))?:\s',
    re.IGNORECASE,
)
_RE_URL = re.compile(r'https?://\S{8,}', re.IGNORECASE)

_BRACKET_TAG_ADVICE = (
    "이슈 제목에는 feat:, fix: 같은 커밋 컨벤션보다 [Feature], [Bug] 같은 대괄호 태그가 "
    "더 표준적인 형식입니다. 다음 이슈부터는 대괄호 태그를 사용해 보세요."
)


def _has_substantial_code_block(body: str) -> bool:
    for m in _RE_CODE_BLOCK.finditer(body):
        inner = m.group(0)[3:-3]
        non_empty = [ln for ln in inner.splitlines() if ln.strip()]
        if len(non_empty) >= 2:
            return True
    return False


def _compute_issue_bonus(issue_type: str, issue_title: str, issue_body: str) -> tuple:
    """(bonus_score: float, earned: list[str]) 반환. 최대 2.0점."""
    title = issue_title or ''
    body = issue_body or ''
    body_no_code = _RE_CODE_BLOCK.sub('', body)

    bonus = 0.0
    earned = []

    # 1. 자료/근거 1.0점 (유형별)
    if issue_type == 'bug':
        has_material = _RE_IMAGE.search(body) or _has_substantial_code_block(body) or _RE_URL.search(body)
        material_label = '재현 자료'
    else:
        has_material = _RE_IMAGE.search(body) or _RE_URL.search(body)
        material_label = '참고 자료'

    if has_material:
        bonus += 1.0
        earned.append(material_label)

    # 2. 컨벤션 0.5점 (대괄호 태그 또는 콜론 접두사)
    if _RE_TITLE_TAG.match(title) or _RE_COLON_CONVENTION.match(title):
        bonus += 0.5
        earned.append('제목 태그')

    # 3. 연결 0.5점 (관련 이슈/PR 링크)
    if _RE_ISSUE_LINK.search(body_no_code):
        bonus += 0.5
        earned.append('이슈/PR 연결')

    return min(bonus, 2.0), earned


def _all_bonus_labels(issue_type: str) -> list:
    return ['재현 자료' if issue_type == 'bug' else '참고 자료', '제목 태그', '이슈/PR 연결']


# ── 점수 계산 ─────────────────────────────────────────────────────

def _compute_fulfilment_score(f: llm_client.IssueFulfilmentResult) -> int:
    """충실도 0~3점. What이 unsatisfied면 0점 고정, N/A는 unsatisfied로 처리."""
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
    """명료성 0~1점. single_focus 포함 — 판정 가능 신호 중 하나라도 unsatisfied면 0점."""
    signals = [c.title_specificity, c.title_body_match, c.single_focus]
    judgeable = [s for s in signals if s != 'N/A']
    if not judgeable:
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

_FULFILMENT_LABELS_BUG = {
    'what': '버그 증상 설명(What)',
    'why': '재현/환경 정보',
    'verification': '기대 동작',
}
_FULFILMENT_LABELS_FEATURE = {
    'what': '제안 내용(What)',
    'why': '배경/문제(Why)',
    'verification': '구현 방향',
}
_CLARITY_LABELS = {
    'title_specificity': '이슈 제목 구체성',
    'title_body_match': '제목-본문 일치성',
    'single_focus': '단일 주제 집중',
}


def _build_sentence_inputs(
    f: llm_client.IssueFulfilmentResult,
    c: llm_client.PrClarityResult,
    issue_type: str,
    bonus_earned: list,
    bonus_missing: list,
) -> tuple:
    good, bad = [], []

    labels = _FULFILMENT_LABELS_BUG if issue_type == 'bug' else _FULFILMENT_LABELS_FEATURE
    for key, label in labels.items():
        val = getattr(f, key)
        if val == 'satisfied':
            good.append(label)
        elif val in ('unsatisfied', 'N/A'):
            bad.append(label)

    # 명료성 통합 (single_focus도 점수 신호이므로 통합 대상에 포함)
    judgeable = {k: getattr(c, k) for k in _CLARITY_LABELS if getattr(c, k) != 'N/A'}
    if any(v == 'satisfied' for v in judgeable.values()):
        good.append('목적 명료성')
    for key, label in _CLARITY_LABELS.items():
        if getattr(c, key) == 'unsatisfied':
            bad.append(label)

    good.extend(bonus_earned)
    bad.extend(bonus_missing)

    return good, bad


# ── 스킵 메시지 ───────────────────────────────────────────────────

_SKIP_MESSAGE = (
    "이 이슈는 버그 리포트나 기능 제안이 아닌 것으로 분류되어 품질 평가 대상이 아닙니다. "
    "품질 평가를 받으시려면 버그 리포트(재현 가능한 오류 보고) 또는 기능 제안(구체적인 기능 추가 요청) "
    "형식으로 이슈를 작성해 주세요."
)


# ── 평가 실행 ─────────────────────────────────────────────────────

def evaluate(github_username: str, repo_name: str, issue_number: int) -> dict:
    issue = GithubIssues.objects.filter(
        owner_id=github_username, repo_name=repo_name, number=issue_number
    ).first()
    if not issue:
        raise ValueError(f"이슈를 찾을 수 없습니다: {github_username}/{repo_name}#{issue_number}")

    raw_title = issue.title or ''
    raw_body = _get_issue_body(github_username, repo_name, issue_number) or ''
    injection_hits = llm_client.scan_injection(raw_title + '\n' + raw_body)
    if injection_hits:
        logger.warning("Issue 인젝션 패턴 감지: %s/%s#%d → %s", github_username, repo_name, issue_number, injection_hits)
    issue_title = sanitize_text(raw_title, '이슈 제목')
    issue_body = sanitize_text(raw_body, '이슈 본문')
    body_present = bool(issue_body.strip())

    # 1. LLM 분류 + 채점 (단일 호출)
    logger.info("LLM 이슈 분류·채점 시작: %s/%s#%d (body_present=%s)", github_username, repo_name, issue_number, body_present)
    score = llm_client.score_issue(repo_name, issue_number, issue_title, issue_body, body_present)

    issue_type = score.issue_type
    logger.info("이슈 유형 분류 결과: %s/%s#%d → %s", github_username, repo_name, issue_number, issue_type)

    # 2. 스킵 처리
    if issue_type == 'skip':
        entity, _ = GithubIssueAiEvaluation.objects.get_or_create(
            github_id=github_username, repo_name=repo_name, issue_number=issue_number
        )
        entity.issue_type = 'skip'
        entity.issue_score = None
        entity.issue_total_score = None
        entity.issue_breakdown = None
        entity.issue_strengths = None
        entity.issue_improvements = None
        entity.issue_advice = None
        entity.issue_missing = None
        entity.save()
        logger.info("이슈 스킵 처리 완료: %s/%s#%d", github_username, repo_name, issue_number)
        return _entity_to_dict(entity, raw_body)

    # 3. 보너스 판정 (코드)
    bonus_score, bonus_earned = _compute_issue_bonus(issue_type, issue_title, issue_body)
    all_bonus = _all_bonus_labels(issue_type)
    bonus_missing = [b for b in all_bonus if b not in bonus_earned]

    f = score.fulfilment
    c = score.clarity
    logger.info(
        "LLM 판정 결과 | 충실도 — what=%s, why=%s, verification=%s | "
        "명료성 — title=%s, match=%s, focus=%s",
        f.what, f.why, f.verification,
        c.title_specificity, c.title_body_match, c.single_focus,
    )

    fulfilment_score = _compute_fulfilment_score(f)
    clarity_score = _compute_clarity_score(c)

    # 보너스 게이팅: 충실도 0점이면 보너스 무효화
    if fulfilment_score == 0 and bonus_score > 0:
        logger.info(
            "보너스 게이팅 발동: %s/%s#%d — 충실도 0점으로 보너스 %.1f점 무효화",
            github_username, repo_name, issue_number, bonus_score,
        )
        bonus_score = 0.0
        bonus_missing = all_bonus
        bonus_earned = []

    total = round(fulfilment_score + clarity_score + bonus_score, 1)
    grade = _to_grade(total)

    # 4. 문장화 입력 구성
    good_items, bad_items = _build_sentence_inputs(f, c, issue_type, bonus_earned, bonus_missing)

    # 5. LLM 문장화
    logger.info("LLM 이슈 문장화 시작: %s/%s#%d", github_username, repo_name, issue_number)
    sentences = llm_client.write_issue_sentences(
        repo_name, issue_number, issue_title, issue_body, good_items, bad_items, issue_type=issue_type
    )

    strengths = (sentences.strengths or []) or ["아직 강조할 만한 항목을 찾지 못했어요. 아래 보완할 점을 참고해 주세요."]
    improvements = (sentences.improvements or []) or ["모든 항목이 충실히 작성되어 현재 보완할 점은 없습니다. 훌륭합니다!"]

    # 콜론 접두사(feat:, fix: 등)를 썼고 대괄호 태그가 아닌 경우 → advice에 안내 추가
    advice = list(sentences.advice or [])
    used_colon = bool(_RE_COLON_CONVENTION.match(issue_title) and not _RE_TITLE_TAG.match(issue_title))
    if used_colon and len(advice) < 3:
        advice.append(_BRACKET_TAG_ADVICE)

    # 6. DB 저장
    entity, _ = GithubIssueAiEvaluation.objects.get_or_create(
        github_id=github_username, repo_name=repo_name, issue_number=issue_number
    )
    entity.issue_type = issue_type
    entity.issue_score = grade
    entity.issue_total_score = total
    entity.issue_breakdown = {
        'fulfilment': fulfilment_score,
        'clarity': clarity_score,
        'bonus': bonus_score,
        'bonus_earned': bonus_earned,
    }
    entity.issue_strengths = strengths
    entity.issue_improvements = improvements
    entity.issue_advice = advice
    entity.issue_missing = bad_items
    entity.save()

    logger.info(
        "이슈 평가 완료: %s/%s#%d → %s (%.1f점 = 충실도%d + 명료성%d + 보너스%.1f) [%s]",
        github_username, repo_name, issue_number, grade, total,
        fulfilment_score, clarity_score, bonus_score, issue_type,
    )
    return _entity_to_dict(entity, raw_body)


# ── dict 변환 ─────────────────────────────────────────────────────

def _entity_to_dict(entity: GithubIssueAiEvaluation, issue_body: Optional[str] = None) -> dict:
    if entity.issue_type == 'skip':
        return {
            'evaluated': True,
            'issue_type': 'skip',
            'skip_message': _SKIP_MESSAGE,
            'issue_number': entity.issue_number,
            'issue_score': None,
            'issue_total_score': None,
            'issue_breakdown': None,
            'issue_strengths': None,
            'issue_improvements': None,
            'issue_advice': None,
            'updated_at': entity.updated_at.isoformat() if entity.updated_at else None,
            'issue_body': issue_body,
        }
    return {
        'evaluated': True,
        'issue_type': entity.issue_type,
        'issue_number': entity.issue_number,
        'issue_score': entity.issue_score,
        'issue_total_score': entity.issue_total_score,
        'issue_breakdown': entity.issue_breakdown,
        'issue_strengths': entity.issue_strengths,
        'issue_improvements': entity.issue_improvements,
        'issue_advice': entity.issue_advice,
        'updated_at': entity.updated_at.isoformat() if entity.updated_at else None,
        'issue_body': issue_body,
    }
