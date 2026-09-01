"""
GitHub 2026 DOM 변경 대응 - User Activity/Page 셀렉터 테스트
"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from datetime import datetime

def test_user_activity(github_id):
    """parse_user_update 테스트 - activity 페이지"""
    print(f"\n{'='*60}")
    print(f"Testing User Activity for: {github_id}")
    print('='*60)

    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(options=chrome_options)

    try:
        # Activity URL 생성 (최근 1년)
        now = datetime.now()
        from_date = f"{now.year-1}-{now.month:02d}-01"
        to_date = f"{now.year}-{now.month:02d}-{now.day:02d}"
        url = f"https://github.com/{github_id}?tab=overview&from={from_date}&to={to_date}"

        print(f"URL: {url}")
        driver.get(url)

        # 2026 GitHub DOM 변경 대응: data-testid 또는 markdown-body 사용
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, '[data-testid="timeline-item"], [data-testid="comment-body"], .markdown-body, .TimelineItem-body'))
            )
            print("✅ Timeline elements found!")
        except Exception as e:
            print(f"❌ Timeline elements NOT found: {e}")
            return

        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')

        # 2026 GitHub DOM 변경 대응: 여러 셀렉터 시도
        events = soup.select('[data-testid="timeline-item"]')
        if not events:
            events = soup.select('.TimelineItem-body')

        print(f"\n📊 Events found: {len(events)}")

        # 이벤트 타입별 카운트
        commit_count = 0
        pr_count = 0
        issue_count = 0
        repo_count = 0

        for event in events[:10]:  # 처음 10개만 분석
            text = event.get_text(strip=True).lower()
            if 'commit' in text:
                commit_count += 1
            elif 'pull request' in text or 'pr' in text:
                pr_count += 1
            elif 'issue' in text:
                issue_count += 1
            elif 'repository' in text or 'created' in text:
                repo_count += 1

        print(f"  - Commits: {commit_count}")
        print(f"  - PRs: {pr_count}")
        print(f"  - Issues: {issue_count}")
        print(f"  - Repos: {repo_count}")

        if len(events) > 0:
            print("\n📝 Sample event (first one):")
            print(events[0].get_text(strip=True)[:200] + "...")

    finally:
        driver.quit()


def test_user_page(github_id):
    """parse_user_page 테스트 - 프로필 페이지 (achievements, highlights)"""
    print(f"\n{'='*60}")
    print(f"Testing User Page for: {github_id}")
    print('='*60)

    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(options=chrome_options)

    try:
        url = f"https://github.com/{github_id}"
        print(f"URL: {url}")
        driver.get(url)

        try:
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'h2.h4.mb-2, [data-testid="profile-achievements"]'))
            )
            print("✅ Profile elements found!")
        except Exception as e:
            print(f"⚠️ Profile elements wait timeout (may still work): {e}")

        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')

        achievements = None
        highlights = None

        # 2026 GitHub DOM 변경 대응: 여러 셀렉터 시도
        info_list = [tag.parent for tag in soup.select('h2.h4.mb-2')]

        if not info_list:
            print("⚠️ h2.h4.mb-2 not found, trying data-testid...")
            achievements_section = soup.select_one('[data-testid="profile-achievements"]')
            if achievements_section:
                achievements = ', '.join(
                    [tag['alt'] for tag in achievements_section.select('img') if tag.get('alt')]
                )
                print(f"✅ Found via data-testid: {achievements}")

        for info in info_list:
            if info.h2 and info.h2.text == 'Achievements':
                achievements = ', '.join(
                    [tag['alt'] for tag in info.select('img') if tag.get('alt')]
                )
            if info.h2 and info.h2.text == 'Highlights':
                highlights = ', '.join(
                    [tag.text.strip() for tag in info.select('li')]
                )

        print(f"\n📊 Results:")
        print(f"  - Achievements: {achievements or '(none found)'}")
        print(f"  - Highlights: {highlights or '(none found)'}")

        # 추가 디버깅: h2 태그들 확인
        h2_tags = soup.select('h2')
        print(f"\n📝 All h2 tags found: {len(h2_tags)}")
        for h2 in h2_tags[:5]:
            print(f"  - {h2.get_text(strip=True)[:50]}")

    finally:
        driver.quit()


if __name__ == '__main__':
    # 테스트할 GitHub ID
    test_users = ['torvalds', 'gvanrossum']  # Linus Torvalds, Guido van Rossum

    for user in test_users:
        test_user_activity(user)
        test_user_page(user)
