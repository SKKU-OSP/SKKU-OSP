"""Python port of ReadmeCodeAnalyzer.java (with HTML <img> tag support added)."""
import logging
import re
from dataclasses import dataclass, field
from typing import List, Optional

logger = logging.getLogger(__name__)

# 제로폭 문자 목록
_ZERO_WIDTH = re.compile(r'[​‌‍﻿­]')
# HTML 주석
_HTML_COMMENT = re.compile(r'<!--.*?-->', re.DOTALL)
# 명백한 인젝션 키워드
_INJECTION_PATTERN = re.compile(
    r'ignore\s+(all\s+)?previous\s+instructions?'
    r'|you\s+are\s+now\s+a'
    r'|disregard\s+(all\s+)?previous'
    r'|system\s*:\s*(ignore|override)',
    re.IGNORECASE,
)


def sanitize_text(text: str, label: str = '텍스트') -> str:
    cleaned = _ZERO_WIDTH.sub('', text)
    cleaned = _HTML_COMMENT.sub('', cleaned)
    if _INJECTION_PATTERN.search(cleaned):
        cleaned = '\n'.join(
            line for line in cleaned.splitlines()
            if not _INJECTION_PATTERN.search(line)
        )
        logger.warning("%s 인젝션 패턴 감지 및 제거됨", label)
    return cleaned


def sanitize_readme(readme: str) -> str:
    return sanitize_text(readme, 'README')

BADGE_DOMAINS = [
    "img.shields.io", "badge.fury.io", "travis-ci.org", "travis-ci.com",
    "codecov.io", "coveralls.io", "circleci.com", "appveyor.com",
    "github.com/badges", "badgen.net", "flat.badgen.net",
    "hits.seeyoufarm.com", "ko-fi.com/img", "visitor-badge",
]

_IMG_MARKDOWN = re.compile(r'!\[.*?\]\(([^)]+)\)')
_IMG_HTML = re.compile(r'<img\s[^>]*src=["\']([^"\']+)["\']', re.IGNORECASE)
_CODE_BLOCK = re.compile(r'```', re.MULTILINE)
_LIST_OR_TABLE = re.compile(r'^([-*+] |\d+\. |\|)', re.MULTILINE)
_FENCE = re.compile(r'^\s{0,3}(`{3,}|~{3,})')
_ATX_HEADING = re.compile(r'^\s{0,3}(#{1,6})[ \t]+(.*)$')
_VERSION = re.compile(
    r'(Python|Node|Ruby|Java|Go|PHP|Kotlin|Swift|Rust|C\+\+|TypeScript)\s*[>=v]?\s*\d'
    r'|>= ?\d+\.\d+|~=\d|\^\d+\.\d+',
    re.IGNORECASE,
)
_DEPS = re.compile(
    r'pip install|pip3 install|npm install|npm i\b|yarn (add|install)|'
    r'conda install|bundle install|go get|go mod|cargo (add|build)|'
    r'apt(-get)? install|brew install|gradle|mvn install',
    re.IGNORECASE,
)
_RUN_CMD = re.compile(
    r'python\d? |npm (run|start|dev)|yarn (run|dev|start)|'
    r'docker(-compose)? (run|up)|streamlit run|java -jar|'
    r'go run|cargo run|make\b|flask run|uvicorn|gunicorn|'
    r'node |npx ',
    re.IGNORECASE,
)


@dataclass
class SubItemDetail:
    good: List[str] = field(default_factory=list)
    bad: List[str] = field(default_factory=list)


def _is_badge(url: str) -> bool:
    url_lower = url.lower()
    return any(domain in url_lower for domain in BADGE_DOMAINS)


def _heading_levels(readme: str) -> List[int]:
    """코드 펜스 밖의 내용이 있는 ATX 헤딩 레벨을 문서 순서대로 반환한다."""
    levels = []
    fence_char = None
    fence_length = 0

    for line in readme.splitlines():
        fence_match = _FENCE.match(line)
        if fence_match:
            marker = fence_match.group(1)
            if fence_char is None:
                fence_char = marker[0]
                fence_length = len(marker)
            elif marker[0] == fence_char and len(marker) >= fence_length:
                fence_char = None
                fence_length = 0
            continue

        if fence_char is not None:
            continue

        heading_match = _ATX_HEADING.match(line)
        if not heading_match:
            continue

        # 닫는 # 표시는 제목 내용으로 세지 않는다. 제목이 비어 있으면 헤딩
        # 구조 판정의 근거로 사용하지 않는다.
        title = heading_match.group(2).strip().rstrip('#').strip()
        if title:
            levels.append(len(heading_match.group(1)))

    return levels


def readability_detail(readme: str) -> SubItemDetail:
    result = SubItemDetail()

    heading_levels = _heading_levels(readme)
    # H3 사용을 강제하지 않는다. 의미 있는 헤딩이 둘 이상이고 문서의 가장
    # 상위 레벨이 H1/H2이면 헤딩으로 섹션을 구조화했다고 본다.
    has_heading_structure = (
        len(heading_levels) >= 2
        and min(heading_levels) <= 2
    )
    (result.good if has_heading_structure else result.bad).append("헤딩 구조 활용")

    cb_count = len(_CODE_BLOCK.findall(readme))
    (result.good if cb_count >= 2 else result.bad).append("코드 블록")

    (result.good if _LIST_OR_TABLE.search(readme) else result.bad).append("목록/표")

    has_skip = any(
        current > previous + 1
        for previous, current in zip(heading_levels, heading_levels[1:])
    )
    has_continuous_headings = bool(heading_levels) and not has_skip
    (result.good if has_continuous_headings else result.bad).append("헤딩 연속성")

    return result


def reproducibility_code_detail(readme: str) -> SubItemDetail:
    result = SubItemDetail()
    (result.good if _VERSION.search(readme) else result.bad).append("버전 명시")
    (result.good if _DEPS.search(readme) else result.bad).append("의존성 설치")
    (result.good if _RUN_CMD.search(readme) else result.bad).append("실행 명령어")
    return result


def analyze_visual(readme: str) -> int:
    for m in _IMG_MARKDOWN.finditer(readme):
        if not _is_badge(m.group(1)):
            return 1
    for m in _IMG_HTML.finditer(readme):
        if not _is_badge(m.group(1)):
            return 1
    return 0


def analyze_license(license_field: Optional[str]) -> int:
    return 1 if license_field and license_field.strip() else 0
