from django.test import SimpleTestCase

from osp.readme_code_analyzer import readability_detail


class ReadmeHeadingContinuityTest(SimpleTestCase):
    def assert_heading_structure(self, readme: str, expected: bool):
        detail = readability_detail(readme)
        actual = '헤딩 구조 활용' in detail.good
        self.assertEqual(actual, expected)

    def assert_heading_continuity(self, readme: str, expected: bool):
        detail = readability_detail(readme)
        actual = '헤딩 연속성' in detail.good
        self.assertEqual(actual, expected)

    def test_no_heading_is_not_continuous(self):
        self.assert_heading_continuity('프로젝트 설명만 있습니다.', False)

    def test_heading_structure_requires_two_meaningful_headings(self):
        self.assert_heading_structure('프로젝트 설명만 있습니다.', False)
        self.assert_heading_structure('# 프로젝트', False)
        self.assert_heading_structure('## 설치', False)

    def test_h1_h2_or_repeated_h2_are_valid_heading_structures(self):
        self.assert_heading_structure('# 프로젝트\n\n## 설치', True)
        self.assert_heading_structure('## 설치\n\n## 실행', True)

    def test_deep_headings_without_a_shallow_parent_are_not_valid_structure(self):
        self.assert_heading_structure('### 설치\n\n### 실행', False)

    def test_structure_and_continuity_are_scored_independently(self):
        readme = '# 프로젝트\n\n### 실행'
        self.assert_heading_structure(readme, True)
        self.assert_heading_continuity(readme, False)

    def test_consecutive_heading_levels_are_continuous(self):
        self.assert_heading_continuity(
            '# 프로젝트\n\n## 설치\n\n### macOS\n\n## 실행',
            True,
        )

    def test_skipping_a_heading_level_is_not_continuous(self):
        self.assert_heading_continuity('# 프로젝트\n\n### 실행', False)
        self.assert_heading_continuity('## 설치\n\n#### Windows', False)

    def test_heading_like_text_inside_code_fence_is_ignored(self):
        self.assert_heading_continuity(
            '```markdown\n# 예제 제목\n## 예제 하위 제목\n```',
            False,
        )

    def test_code_fence_heading_does_not_break_real_structure(self):
        self.assert_heading_continuity(
            '# 프로젝트\n\n```markdown\n### 예제\n```\n\n## 설치',
            True,
        )
