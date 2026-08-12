"""이슈 채점 로직 테스트 — 순수 함수 검증 + LLM 분류 실판정."""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'osp.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from osp.issue_evaluation_service import (
    _compute_fulfilment_score,
    _compute_clarity_score,
    _compute_issue_bonus,
    _to_grade,
    _build_sentence_inputs,
    _all_bonus_labels,
)
from osp.llm_client import (
    IssueFulfilmentResult,
    PrClarityResult,
    score_issue,
)

# ── 헬퍼 ──────────────────────────────────────────────────────────

def fulfilment(what='satisfied', why='satisfied', verification='satisfied'):
    return IssueFulfilmentResult(what=what, why=why, verification=verification)

def clarity(title_specificity='satisfied', title_body_match='satisfied', single_focus='N/A'):
    return PrClarityResult(
        title_specificity=title_specificity,
        title_body_match=title_body_match,
        single_focus=single_focus,
    )

def sep(char='─', width=60):
    print(char * width)


# ══════════════════════════════════════════════════════════════════
# 1. 순수 함수 테스트 (LLM 호출 없음)
# ══════════════════════════════════════════════════════════════════

print()
sep('=')
print("1. 순수 함수 단위 테스트 (LLM 호출 없음)")
sep('=')

# ── 충실도 점수 ───────────────────────────────────────────────────

print("\n[충실도 점수 — What 게이트 + 3/2/1/0]")

def fulfilment_case(label, what, why, ver, expected):
    f = fulfilment(what=what, why=why, verification=ver)
    score = _compute_fulfilment_score(f)
    ok = score == expected
    mark = '✓' if ok else f'✗ FAIL (기대 {expected})'
    print(f"  [{mark}] {label}")
    print(f"    what={what}, why={why}, ver={ver} → {score}점")

fulfilment_case("What 충족 + Why·Ver 모두 충족 → 3점",
    'satisfied', 'satisfied', 'satisfied', 3)
fulfilment_case("What 충족 + Why만 충족 → 2점",
    'satisfied', 'satisfied', 'unsatisfied', 2)
fulfilment_case("What 충족 + Ver만 충족 → 2점",
    'satisfied', 'N/A', 'satisfied', 2)
fulfilment_case("What 충족 + Why·Ver 모두 미충족 → 1점",
    'satisfied', 'unsatisfied', 'unsatisfied', 1)
fulfilment_case("What 충족 + Why·Ver 모두 N/A (본문 없음) → 1점",
    'satisfied', 'N/A', 'N/A', 1)
fulfilment_case("What 미충족 → 게이트 발동 0점",
    'unsatisfied', 'satisfied', 'satisfied', 0)
fulfilment_case("What 미충족 + 나머지 N/A → 0점",
    'unsatisfied', 'N/A', 'N/A', 0)

# ── 명료성 점수 ───────────────────────────────────────────────────

print("\n[명료성 점수 — single_focus 포함, 하나라도 unsatisfied → 0점]")

def clarity_case(label, ts, tbm, sf, expected):
    c = clarity(title_specificity=ts, title_body_match=tbm, single_focus=sf)
    score = _compute_clarity_score(c)
    ok = score == expected
    mark = '✓' if ok else f'✗ FAIL (기대 {expected})'
    print(f"  [{mark}] {label}")
    print(f"    ts={ts}, tbm={tbm}, sf={sf} → {score}점")

clarity_case("전부 satisfied → 1점",
    'satisfied', 'satisfied', 'satisfied', 1)
clarity_case("title_specificity만 satisfied, 나머지 N/A → 1점",
    'satisfied', 'N/A', 'N/A', 1)
clarity_case("title_specificity unsatisfied → 0점",
    'unsatisfied', 'satisfied', 'satisfied', 0)
clarity_case("single_focus unsatisfied → 0점 (PR과 다른 점)",
    'satisfied', 'satisfied', 'unsatisfied', 0)
clarity_case("title_body_match unsatisfied → 0점",
    'satisfied', 'unsatisfied', 'N/A', 0)
clarity_case("모두 N/A (본문 없음) → 0점",
    'satisfied', 'N/A', 'N/A', 1)  # title_specificity=satisfied, 나머지 N/A

# ── 보너스 판정 ───────────────────────────────────────────────────

print("\n[보너스 판정 — 자료(1.0) + 제목태그(0.5) + 연결(0.5)]")

def bonus_case(label, issue_type, title, body, expected_score, expected_earned=()):
    score, earned = _compute_issue_bonus(issue_type, title, body)
    ok_score = abs(score - expected_score) < 0.01
    ok_earned = set(earned) == set(expected_earned) if expected_earned else True
    ok = ok_score and ok_earned
    mark = '✓' if ok else f'✗ FAIL (기대 점수 {expected_score}, 기대 earned {expected_earned})'
    print(f"  [{mark}] {label}")
    print(f"    earned={earned}, score={score}")

bonus_case("버그 — 이미지 + 대괄호 + 이슈연결",
    'bug', '[Bug] 로그인 오류',
    '재현 절차\n```\nerror log line1\nerror log line2\n```\ncloses #5',
    2.0, ('재현 자료', '제목 태그', '이슈/PR 연결'))

bonus_case("기능 — URL링크만 (이미지 없음)",
    'feature', '다크모드 추가',
    '참고: https://material.io/design/color/dark-theme.html',
    1.0, ('참고 자료',))

bonus_case("버그 — 코드블록만 (2줄 이상)",
    'bug', '페이지 오류',
    '```\nNullPointerException\nat Main.java:42\n```',
    1.0, ('재현 자료',))

bonus_case("기능 — 코드블록만 (이미지·URL 없음) → 기능엔 코드블록 미인정",
    'feature', '검색 기능 추가',
    '```\nsearch query\nresult list\n```',
    0.0, ())

bonus_case("대괄호 태그 없는 콜론 컨벤션 → 제목태그 인정",
    'bug', 'fix: 로그인 버그',
    '로그인 버튼이 동작하지 않습니다.',
    0.5, ('제목 태그',))

bonus_case("대괄호 + 콜론 둘 다 있음 → 0.5점 (중복 지급 안 됨)",
    'bug', '[Bug] fix: 로그인 버그',
    '',
    0.5, ('제목 태그',))

bonus_case("아무것도 없음 → 0점",
    'feature', '기능 추가해주세요',
    '기능이 있었으면 좋겠어요.',
    0.0, ())

bonus_case("이슈 연결 — closes #N",
    'bug', '버그',
    'closes #12 발생합니다.',
    0.5, ('이슈/PR 연결',))

bonus_case("코드블록 내 #숫자 — 연결 오탐 방지",
    'bug', '버그',
    '```python\nid = #12\ncount = #34\n```',
    0.0, ())


# ══════════════════════════════════════════════════════════════════
# 2. LLM 실판정 테스트 — 유형 분류 + 채점
# ══════════════════════════════════════════════════════════════════

print()
sep('=')
print("2. LLM 실판정 테스트 (실제 LLM 호출)")
sep('=')

def issue_score_result(title, body, repeat=1, expected_type=None, label=''):
    """score_issue() 호출 후 결과 출력. repeat > 1이면 여러 번 호출해 일관성 확인."""
    body_present = bool(body and body.strip())
    results = []
    for i in range(repeat):
        try:
            s = score_issue('test-repo', 0, title, body, body_present)
            f = s.fulfilment
            c = s.clarity
            if f:
                f_score = _compute_fulfilment_score(f)
                c_score = _compute_clarity_score(c)
                bonus_score, bonus_earned = _compute_issue_bonus(
                    s.issue_type, title, body
                )
                if f_score == 0 and bonus_score > 0:
                    bonus_score = 0.0
                    bonus_earned = []
                total = round(f_score + c_score + bonus_score, 1)
                grade = _to_grade(total)
                results.append({
                    'type': s.issue_type,
                    'what': f.what,
                    'why': f.why,
                    'ver': f.verification,
                    'ts': c.title_specificity,
                    'tbm': c.title_body_match,
                    'sf': c.single_focus,
                    'f': f_score, 'c': c_score, 'b': bonus_score,
                    'total': total, 'grade': grade,
                    'bonus_earned': bonus_earned,
                    'error': None,
                })
            else:
                results.append({'type': s.issue_type, 'error': None})
        except Exception as e:
            results.append({'type': None, 'error': str(e)})

    sep()
    print(f"[{label}]")
    print(f"  제목: {title!r}")
    if body:
        preview = body.strip()[:80].replace('\n', ' ')
        print(f"  본문: {preview!r}{'...' if len(body.strip()) > 80 else ''}")
    else:
        print("  본문: (없음)")

    types_seen = []
    for idx, r in enumerate(results, 1):
        prefix = f"  시도{idx}" if repeat > 1 else " "
        if r['error']:
            print(f"{prefix} → ERROR: {r['error']}")
            continue
        issue_type = r['type']
        types_seen.append(issue_type)
        if issue_type == 'skip':
            print(f"{prefix} → 유형: skip")
        elif 'f' in r:
            print(
                f"{prefix} → 유형: {issue_type} | "
                f"충실도({r['f']}) 명료성({r['c']}) 보너스({r['b']}) "
                f"= {r['total']}점 {r['grade']}"
            )
            print(
                f"{'':10} what={r['what']}, why={r['why']}, ver={r['ver']}, "
                f"ts={r['ts']}, tbm={r['tbm']}, sf={r['sf']}"
            )
            if r['bonus_earned']:
                print(f"{'':10} bonus_earned={r['bonus_earned']}")
        else:
            print(f"{prefix} → 유형: {issue_type}")

    if expected_type is not None:
        if expected_type == 'not_skip':
            ok = all(t != 'skip' for t in types_seen if t)
            verdict = '✓ 스킵 아님 확인' if ok else '✗ FAIL — 스킵으로 새었음 ★'
        else:
            ok = all(t == expected_type for t in types_seen if t)
            verdict = f'✓ {expected_type} 일관' if ok else f'✗ FAIL — 기대 {expected_type}, 실제 {set(types_seen)}'
        print(f"  판정: {verdict}")

    if repeat > 1 and types_seen:
        unique = set(types_seen)
        consistent = len(unique) == 1
        print(f"  일관성: {types_seen} → {'✓ 일관' if consistent else '⚠ 불일치 ' + str(unique)}")


# ══════════════════════════════════════════════════════════════════
# 그룹 A — 스킵되면 안 되는 것 ★ 제일 중요
# ══════════════════════════════════════════════════════════════════

print()
sep('=')
print("그룹 A — 스킵되면 안 되는 것 (짧아도 명확한 단일 요청)")
print("★ A-1, A-2가 스킵으로 새면 프롬프트 수정 필요")
sep('=')

issue_score_result(
    label="A-1. 한 줄 기능 요청 (배경·방향 없음) — feature, C~D 기대",
    title="다크 모드 추가",
    body="다크 모드 지원 기능을 추가해주세요.",
    expected_type='not_skip',
)

issue_score_result(
    label="A-2. 한 줄 버그 보고 (재현·환경 없음) — bug, C~D 기대",
    title="로그인 안 됨",
    body="로그인 버튼을 눌러도 로그인이 안 됩니다.",
    expected_type='not_skip',
)

issue_score_result(
    label="A-3. 제목만 명확, 본문 없음 — feature, 엄격 기준 적용",
    title="게시글 검색 기능 추가",
    body="",
    expected_type='not_skip',
)


# ══════════════════════════════════════════════════════════════════
# 그룹 B — 스킵돼야 하는 것 (대조군)
# ══════════════════════════════════════════════════════════════════

print()
sep('=')
print("그룹 B — 스킵돼야 하는 것 (대조군)")
sep('=')

issue_score_result(
    label="B-1. 순수 질문 — skip 기대",
    title="이 함수 왜 이렇게 짰나요?",
    body=(
        "UserService의 validateToken 함수에서 왜 예외를 던지지 않고 "
        "null을 반환하는지 궁금합니다."
    ),
    expected_type='skip',
)

issue_score_result(
    label="B-2. 작업 완료 기록 — skip 기대",
    title="중간 발표 준비",
    body="- 발표 자료 초안 작성\n- 데모 시나리오 정리",
    expected_type='skip',
)


# ══════════════════════════════════════════════════════════════════
# 그룹 C — 경계 케이스 (라운드 방식으로 반복, 재현성 확인)
# C-1→C-2→C-3→C-4 를 REPEAT_C 라운드 반복 후 케이스별 결과 집계
# ══════════════════════════════════════════════════════════════════

REPEAT_C = 3

C_CASES = [
    dict(
        key='C-1',
        label="C-1. 버그인지 기능인지 애매 (오류 수정 요청) — not_skip 기대, 유형 흔들려도 OK",
        title="프로필 이미지가 기본 이미지로만 나옴",
        body=(
            "프로필을 업로드해도 항상 기본 이미지가 표시됩니다.\n"
            "업로드한 이미지가 제대로 보이도록 해주세요."
        ),
        expected_type='not_skip',
    ),
    dict(
        key='C-2',
        label="C-2. 질문 + 기능 혼재 — 스킵 또는 feature, 반복 일관성 관찰",
        title="댓글 정렬 관련",
        body=(
            "댓글이 최신순으로 안 뜨는데 원래 이런 건가요?\n"
            "최신순 정렬 옵션을 추가하면 좋겠습니다."
        ),
        expected_type=None,
    ),
    dict(
        key='C-3',
        label="C-3. 단일 주제 여러 항목 — feature + single_focus satisfied 기대 ★핵심",
        title="회원가입 검증 강화",
        body=(
            "- 이메일 형식 검증 추가\n"
            "- 비밀번호 8자 이상 검증 추가\n"
            "- 중복 닉네임 검증 추가"
        ),
        expected_type='not_skip',
    ),
    dict(
        key='C-4',
        label="C-4. 대량 혼재 (기능+버그+질문) — skip 기대",
        title="이것저것 수정",
        body=(
            "- 버튼 색 바꾸기\n"
            "- 로그인 버그 있음\n"
            "- 검색 기능 추가해주세요\n"
            "- 이 부분 왜 이렇게 했나요?\n"
            "- 폰트 키우기"
        ),
        expected_type='skip',
    ),
]

# 케이스별 결과 누적
c_results = {c['key']: [] for c in C_CASES}

print()
sep('=')
print(f"그룹 C — 경계 케이스 ({REPEAT_C}라운드 × {len(C_CASES)}케이스, 케이스 섞어서 반복)")
print("핵심: C-3이 스킵 아니고 기능으로 평가되는가 (단일 주제 여러 항목)")
sep('=')

for rnd in range(1, REPEAT_C + 1):
    print(f"\n── 라운드 {rnd} ──")
    for case in C_CASES:
        body_present = bool(case['body'] and case['body'].strip())
        try:
            s = score_issue('test-repo', 0, case['title'], case['body'], body_present)
            f, c = s.fulfilment, s.clarity
            if f:
                f_score = _compute_fulfilment_score(f)
                c_score = _compute_clarity_score(c)
                bonus_score, bonus_earned = _compute_issue_bonus(s.issue_type, case['title'], case['body'])
                if f_score == 0 and bonus_score > 0:
                    bonus_score, bonus_earned = 0.0, []
                total = round(f_score + c_score + bonus_score, 1)
                grade = _to_grade(total)
                row = dict(
                    type=s.issue_type, f=f_score, c=c_score, b=bonus_score,
                    total=total, grade=grade,
                    what=f.what, why=f.why, ver=f.verification,
                    ts=c.title_specificity, tbm=c.title_body_match, sf=c.single_focus,
                    error=None,
                )
            else:
                row = dict(type=s.issue_type, error=None)
        except Exception as e:
            row = dict(type=None, error=str(e))

        c_results[case['key']].append(row)

        if row['error']:
            print(f"  {case['key']} → ERROR: {row['error']}")
        elif row['type'] == 'skip':
            print(f"  {case['key']} → skip")
        elif 'f' in row:
            print(
                f"  {case['key']} → {row['type']} | "
                f"충실도({row['f']}) 명료성({row['c']}) 보너스({row['b']}) "
                f"= {row['total']}점 {row['grade']} | "
                f"sf={row['sf']}"
            )
        else:
            print(f"  {case['key']} → {row['type']}")

# 케이스별 집계
print()
sep('=')
print("그룹 C — 케이스별 집계")
sep('=')
for case in C_CASES:
    rows = c_results[case['key']]
    types = [r['type'] for r in rows if not r.get('error')]
    unique_types = set(types)
    consistent = len(unique_types) <= 1

    print(f"\n[{case['key']}] {case['label']}")
    print(f"  유형 결과: {types}")
    print(f"  일관성: {'✓ 일관 ' + str(unique_types) if consistent else '⚠ 불일치 ' + str(unique_types)}")

    expected = case['expected_type']
    if expected == 'not_skip':
        ok = all(t != 'skip' for t in types if t)
        print(f"  판정: {'✓ 스킵 아님 확인' if ok else '✗ FAIL — 스킵으로 새었음 ★'}")
    elif expected == 'skip':
        ok = all(t == 'skip' for t in types if t)
        print(f"  판정: {'✓ skip 일관' if ok else '✗ FAIL — skip 아닌 케이스 있음'}")
    elif expected is None:
        print(f"  판정: 관찰 (기대 없음 — 일관성만 확인)")


# ══════════════════════════════════════════════════════════════════
# 콜론 컨벤션 보너스 확인
# ══════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════════
# 그룹 D — 스펙트럼 양 끝 + 게이팅 실전
# D-1: A+ 첫 확인 (기능 제안 만점), D-2: 버그 충실도 3점, D-3: 게이팅 발동
# ══════════════════════════════════════════════════════════════════

print()
sep('=')
print("그룹 D — 스펙트럼 양 끝 + 게이팅 실전")
print("D-1: A+ 기대(6.0), D-2: 버그 3점 기대(4.5), D-3: 게이팅→0점 기대")
sep('=')

issue_score_result(
    label=(
        "D-1. A+ 기능 제안 — 충실도3+명료성1+보너스2.0=6.0, A+\n"
        "★ 이슈 연결(#12) 정탐 첫 확인 / [Feature] 대괄호 / 이미지 참고자료"
    ),
    title="[Feature] 영화 상세 화면에 평점 분포 그래프 추가",
    body=(
        "## 배경\n"
        "현재 영화 상세 화면은 평균 평점만 숫자로 보여줘서, 사용자가\n"
        "평점이 고르게 분포하는지 극단적으로 갈리는지 알 수 없다.\n"
        "평점 3.5인 영화가 \"다들 무난하게 3.5\"인지 \"1점과 5점이 반반\"인지\n"
        "구분이 안 된다.\n\n"
        "## 제안 내용\n"
        "영화 상세 화면 평균 평점 옆에 1~5점 구간별 리뷰 수를 막대그래프로 표시한다.\n\n"
        "## 구현 방향\n"
        "- movie_stats에 이미 있는 리뷰 데이터를 평점 구간별로 집계\n"
        "- 상세 화면 평점 영역 아래에 가로 막대그래프 컴포넌트 추가\n"
        "- 각 막대에 해당 구간 리뷰 수와 비율(%) 표시\n"
        "- 리뷰가 없는 영화는 그래프 대신 \"아직 평점이 없습니다\" 표시\n\n"
        "## 참고\n"
        "아래 목업 이미지와 같은 형태를 생각하고 있습니다.\n"
        "![평점 분포 그래프 목업](https://example.com/mockup.png)\n\n"
        "관련 이슈: #12 (평점 시스템 개편)"
    ),
    expected_type='not_skip',
)

issue_score_result(
    label=(
        "D-2. 버그 충실도 3점 — 증상+재현절차+환경+기대동작 완비\n"
        "★ 버그 fulfilment 3 첫 확인 / [Bug] 컨벤션 / 총점 4.5 A 기대"
    ),
    title="[Bug] 리뷰 작성 후 새로고침하면 평점이 0으로 표시됨",
    body=(
        "## 증상\n"
        "영화 상세 화면에서 리뷰를 작성하면 처음엔 내가 준 평점이\n"
        "정상 표시되는데, 페이지를 새로고침하면 그 리뷰의 평점이\n"
        "0.0으로 바뀌어 보인다.\n\n"
        "## 재현 절차\n"
        "1. 아무 영화 상세 화면 진입\n"
        "2. 리뷰 작성 (평점 4.5, 본문 입력) 후 등록\n"
        "3. 등록 직후에는 4.5로 정상 표시됨\n"
        "4. F5로 새로고침\n"
        "5. 방금 쓴 리뷰의 평점이 0.0으로 표시됨\n\n"
        "## 환경\n"
        "- Chrome 120, macOS\n"
        "- 로그인 상태에서 발생\n\n"
        "## 기대 동작\n"
        "새로고침 후에도 작성한 평점(4.5)이 그대로 표시되어야 한다."
    ),
    expected_type='not_skip',
)

issue_score_result(
    label=(
        "D-3. 게이팅 발동 — 증상 불명확(What unsatisfied) → 충실도 0\n"
        "★ 이미지+연결 있어도 보너스 전부 0이 되는지 확인 / D 기대\n"
        "  (스킵되면 게이팅 확인 불가 — 결과 유형 주목)"
    ),
    title="[Bug] 게시판 관련",
    body=(
        "게시판에서 문제가 있는 것 같습니다.\n\n"
        "![스크린샷](https://example.com/error.png)\n\n"
        "관련: #7"
    ),
    expected_type='not_skip',
)


print()
sep('=')
print("콜론 컨벤션 보너스 확인 (LLM 호출 없이 보너스 함수만)")
sep('=')

def check_convention(label, title, body, expect_tag_bonus, expect_colon_advice):
    _, earned = _compute_issue_bonus('bug', title, body)
    has_tag = '제목 태그' in earned
    from osp.issue_evaluation_service import _RE_COLON_CONVENTION, _RE_TITLE_TAG
    used_colon = bool(_RE_COLON_CONVENTION.match(title) and not _RE_TITLE_TAG.match(title))
    ok_bonus = has_tag == expect_tag_bonus
    ok_advice = used_colon == expect_colon_advice
    ok = ok_bonus and ok_advice
    mark = '✓' if ok else '✗ FAIL'
    print(f"  [{mark}] {label}")
    print(f"    earned={earned}, 제목태그={has_tag}, colon_advice_hint={used_colon}")

check_convention(
    "fix: 현재 페이지 강조 → 보너스 ✓, 대괄호 조언 힌트 ✓",
    "fix: 현재 페이지 강조", "",
    expect_tag_bonus=True, expect_colon_advice=True,
)
check_convention(
    "[Feature] 다크모드 추가 → 보너스 ✓, 대괄호 조언 힌트 없음",
    "[Feature] 다크모드 추가", "",
    expect_tag_bonus=True, expect_colon_advice=False,
)
check_convention(
    "접두사 없는 이슈 → 보너스 ✗, 조언 힌트 없음",
    "로그인이 안 돼요", "",
    expect_tag_bonus=False, expect_colon_advice=False,
)


sep('=')
print("완료")