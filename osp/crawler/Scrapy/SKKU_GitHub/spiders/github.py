import json
import math
import logging
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import scrapy
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from ..items import *
from ..settings import *


API_URL = 'https://api.github.com'
HTML_URL = 'https://github.com'


class GithubSpider(scrapy.Spider):
    name = 'github'

    def __init__(self, ids='', **kwargs):
        self.ids = []
        if ids != '':
            self.ids = ids.split(',')
        self.flag = 0
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chromedriver_path = ChromeDriverManager().install()
        print(f"Chromedriver path: {chromedriver_path}")  # 경로를 출력하여 확인
        self.driver = webdriver.Chrome(service=ChromeService(
            chromedriver_path), options=chrome_options)


def close(self, reason):
    """스파이더 종료 시 크롬 닫고 로그 남기기"""
    if getattr(self, "driver", None):
        try:
            self.driver.quit()
            logging.info("Chrome driver closed successfully")
        except Exception as e:
            logging.warning(f"Error while closing Chrome driver: {e}")
    logging.info(f"Spider closed. Reason: {reason}")

    def start_requests(self):
        for id in self.ids:
            yield self.get_recent(f'users/{id}')

    def __end_of_month(self, now: datetime):
        next_month = now.month % 12 + 1
        next_year = now.year + now.month // 12
        return datetime(next_year, next_month, 1) - timedelta(seconds=1)

    def get_recent(self, endpoint):
        # 타겟 유저의 최신 push 기록을 확인한다.
        try:
            GITHUB_API_URL = f"{API_URL}/{endpoint}/repos?per_page=1&sort=pushed"
            print(GITHUB_API_URL)
            return scrapy.Request(GITHUB_API_URL, callback=self.find_recent, meta={"endpoint": endpoint})
        except Exception as e:
            print("exception")
            logging.warning("recent pushed")
            return self.api_get(endpoint, self.parse_user)

    def find_recent(self, res):
        # push 기록을 저장한 후 api_get을 호출해 크롤링을 진행한다.
        try:
            print("find_recent")
            endpoint = res.meta["endpoint"]
            recent_json = json.loads(res.body)
            recent_at = recent_json[0]["pushed_at"]
            metadata = {"recent": recent_at[:10]}
        except Exception:
            logging.warning("parse err: recent pushed")
            metadata = {"recent": None}

        return self.api_get(endpoint, self.parse_user, metadata=metadata)

    def api_get(self, endpoint, callback, metadata={}, page=1, per_page=100):
        print(f'{API_URL}/{endpoint}?page={page}&per_page={per_page}')
        req = scrapy.Request(
            f'{API_URL}/{endpoint}?page={page}&per_page={per_page}',
            callback,
            meta=metadata,
            dont_filter=True
        )

        return req

    def parse_user(self, res):
        print("parse_user")
        user_json = json.loads(res.body)
        github_id = user_json['login']
        user_item = User()
        user_item['github_id'] = github_id
        user_item['followers'] = user_json['followers']
        user_item['followings'] = user_json['following']
        user_item['total_repos'] = user_json['public_repos']
        user_item['total_commits'] = 0
        user_item['total_PRs'] = 0
        user_item['total_issues'] = 0
        user_item['stars'] = 0
        user_item['request_cnt'] = 1 + \
            max(math.ceil(user_json['public_repos'] / 100), 1)

        created_date = user_json['created_at'][:10]
        updated_date = user_json['updated_at'][:10]

        pivot_date = datetime.strptime(created_date[:7], '%Y-%m')
        end_date = datetime.strptime(updated_date[:7], '%Y-%m')
        recent_date = res.meta['recent']
        user_item["github_updated_date"] = updated_date
        if recent_date != None:
            recent_date_yy_mm = datetime.strptime(recent_date[:7], '%Y-%m')
            if end_date < recent_date_yy_mm:
                end_date = recent_date_yy_mm
                user_item["github_updated_date"] = recent_date
        # 최근 업데이트 날짜와 비교하기 위해 크롤러 날짜 저장
        user_item["created_date"] = created_date
        user_item["crawled_date"] = datetime.now().strftime("%Y-%m-%d")
        user_item["updated_date"] = datetime.now().strftime("%Y-%m-%d")

        logging.info(f"parse_user: {github_id} end_date: {end_date}")

        end_date = self.__end_of_month(end_date)
        while pivot_date < end_date:
            pivot_date = self.__end_of_month(pivot_date) + timedelta(days=1)
            user_item['request_cnt'] += 1
        yield user_item

        yield self.api_get(
            f'users/{github_id}/repos',
            self.parse_user_repo,
            {'github_id': github_id, 'page': 1}
        )

        pivot_date = datetime.strptime(created_date[:7], '%Y-%m')
        while pivot_date < end_date:
            from_date = pivot_date.strftime('%Y-%m-%d')
            to_date = self.__end_of_month(pivot_date).strftime('%Y-%m-%d')
            yield scrapy.Request(
                f'{HTML_URL}/{github_id}/?tab=overview&from={from_date}&to={to_date}',
                self.parse_user_update,
                meta={'github_id': github_id, 'from': from_date, 'to': to_date},
            )
            pivot_date = self.__end_of_month(pivot_date) + timedelta(days=1)

        yield scrapy.Request(
            f'{HTML_URL}/{user_json["login"]}',
            self.parse_user_page,
            meta={'github_id': github_id}
        )

        yield self.api_get(
            f'users/{github_id}/following',
            self.parse_user_following,
            metadata={'github_id': github_id, 'page': 1}
        )

        yield self.api_get(
            f'users/{github_id}/starred',
            self.parse_user_starred,
            metadata={'github_id': github_id, 'page': 1}
        )

    def parse_user_update(self, res):
        github_id = res.meta['github_id']
        self.driver.get(res.url)
        WebDriverWait(self.driver, 5).until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, '.TimelineItem-body'))
        )

        html = self.driver.page_source
        soup = BeautifulSoup(html, 'html.parser')
        # soup = BeautifulSoup(res.body, 'html.parser')
        # if self.flag == 1:
        #     print("soup\n\n")
        #     print(soup)
        #     print("\n\nsoup")
        #     self.flag = 0
        user_update = UserUpdate()
        user_update['github_id'] = github_id
        user_update['target'] = 'activity'
        user_update['total_commits'] = 0
        user_update['total_PRs'] = 0
        user_update['total_issues'] = 0

        user_period = UserPeriod()
        user_period['github_id'] = github_id
        user_period['start_yymm'] = res.meta['from']
        user_period['end_yymm'] = res.meta['to']
        user_period['num_of_cr_repos'] = 0
        user_period['stars'] = 0
        owned_repo = set()
        contributed_repo = set()
        events = soup.select('.TimelineItem-body')
        # if self.flag == 1:
        #     print(self.flag)
        #     print("soup\n\n")
        #     print(res.url)
        #     print(events)
        #     print("\n\nsoup")
        #     self.flag = 0
        for event in events:
            summary = event.select_one('summary')
            body = event.select('details > div > details')
            if summary == None:
                summary = event.select_one('h4')
                if summary == None:
                    pass
                else:
                    summary = ' '.join(summary.text.strip().split())
                    if 'Opened their first issue' in summary:
                        user_update['total_issues'] += 1
                    if 'Opened their first pull request' in summary:
                        user_update['total_PRs'] += 1
                    if 'Created an issue' in summary:
                        user_update['total_issues'] += 1
                        issue = Issue()
                        repo_link = event.select_one('h4 > a')['href'][1:]
                        repo = tuple(repo_link.split('/'))
                        issue['github_id'] = github_id
                        issue['owner_id'] = repo[0]
                        issue['repo_name'] = repo[1]
                        issue['title'] = event.select_one('h3 > a').text
                        issue_link = event.select_one('h3 > a')['href']
                        num_start = issue_link.rfind('/') + 1
                        issue['number'] = issue_link[num_start:]
                        date = event.select_one('time').text.strip()
                        try:
                            date = datetime.strptime(date, '%b %d')
                            issue['date'] = date.replace(
                                year=int(res.meta['from'][:4]))
                        except ValueError:
                            issue['date'] = datetime(
                                int(res.meta['from'][:4]), 2, 29, 0, 0)
                            logging.info(f"Issue date ValueError: {date}")
                        if repo[0] != github_id:
                            contributed_repo.add(repo)
                        else:
                            owned_repo.add(repo)
                        yield issue
                    if 'Created a pull request' in summary:
                        user_update['total_PRs'] += 1
                        pr = PullRequest()
                        repo = tuple(event.select_one('h4 > a')
                                     ['href'][1:].split('/'))
                        pr['github_id'] = github_id
                        pr['owner_id'] = repo[0]
                        pr['repo_name'] = repo[1]
                        pr['title'] = event.select_one('h3 > a').text
                        pr_link = event.select_one('h3 > a')['href']
                        num_start = pr_link.rfind('/') + 1
                        pr['number'] = pr_link[num_start:]
                        date = event.select_one('time').text.strip()
                        try:
                            date = datetime.strptime(date, '%b %d')
                            pr['date'] = date.replace(
                                year=int(res.meta['from'][:4]))
                        except ValueError:
                            pr['date'] = datetime(
                                int(res.meta['from'][:4]), 2, 29, 0, 0)
                            logging.info(f"pr date ValueError: {date}")
                        if repo[0] != github_id:
                            contributed_repo.add(repo)
                        else:
                            owned_repo.add(repo)
                        yield pr
                continue
            summary = summary.text.strip().split()
            if summary[0] == 'Created':
                # Create Commit
                if summary[2] == 'commit' or summary[2] == 'commits':
                    commit_list = event.select('li')
                    for commit in commit_list:
                        detail = commit.select('a')
                        commit_cnt = int(detail[1].text.strip().split()[0])
                        user_update['total_commits'] += commit_cnt
                        repo = tuple(detail[0]['href'][1:].split('/'))
                        if repo[0] != github_id:
                            contributed_repo.add(repo)
                        else:
                            owned_repo.add(repo)
                # Create Repository
                elif summary[2] == 'repository' or summary[2] == 'repositories':
                    create_list = event.select('li')
                    for commit in create_list:
                        detail = commit.select('a')
                        repo = tuple(detail[0]['href'][1:].split('/'))
                        if repo[0] != github_id:
                            contributed_repo.add(repo)
                        else:
                            owned_repo.add(repo)
                    user_period['num_of_cr_repos'] += 1
            elif summary[0] == 'Opened':
                # Open Issues
                if 'issue' in summary or 'issues' in summary:
                    user_update['total_issues'] += int(summary[1])
                    for issue_repo in body:
                        repo = issue_repo.select_one(
                            'summary span').text.strip()
                        repo = tuple(repo.split('/'))
                        if repo[0] != github_id:
                            contributed_repo.add(repo)
                        else:
                            owned_repo.add(repo)
                        for issue_tag in issue_repo.select('li'):
                            if issue_tag.select_one('a > span') is None:
                                continue
                            issue = Issue()
                            issue['github_id'] = github_id
                            issue['owner_id'] = repo[0]
                            issue['repo_name'] = repo[1]
                            issue['title'] = issue_tag.select_one(
                                'a > span').text
                            issue_link = issue_tag.select_one('a')['href']
                            num_start = issue_link.rfind('/') + 1
                            issue['number'] = issue_link[num_start:]
                            date = issue_tag.select_one('time').text.strip()
                            try:
                                date = datetime.strptime(date, '%b %d')
                                issue['date'] = date.replace(
                                    year=int(res.meta['from'][:4]))
                            except ValueError:
                                issue['date'] = datetime(
                                    int(res.meta['from'][:4]), 2, 29, 0, 0)
                                logging.info(f"Issue date ValueError: {date}")
                            yield issue
                # Open Pull Requests
                elif 'request' in summary or 'requests' in summary:
                    user_update['total_PRs'] += int(summary[1])
                    for pr_repo in body:
                        repo = pr_repo.select_one('summary span').text.strip()
                        repo = tuple(repo.split('/'))
                        if repo[0] != github_id:
                            contributed_repo.add(repo)
                        else:
                            owned_repo.add(repo)
                        for pr_tag in pr_repo.select('li'):
                            if pr_tag.select_one('a > span') is None:
                                continue
                            pr = PullRequest()
                            pr['github_id'] = github_id
                            pr['owner_id'] = repo[0]
                            pr['repo_name'] = repo[1]
                            pr['title'] = pr_tag.select_one('a > span').text
                            pr_link = pr_tag.select_one('a')['href']
                            num_start = pr_link.rfind('/') + 1
                            pr['number'] = pr_link[num_start:]
                            date = pr_tag.select_one('time').text.strip()
                            try:
                                date = datetime.strptime(date, '%b %d')
                                pr['date'] = date.replace(
                                    year=int(res.meta['from'][:4]))
                            except ValueError:
                                pr['date'] = datetime(
                                    int(res.meta['from'][:4]), 2, 29, 0, 0)
                                logging.info(f"pr date ValueError: {date}")
                            yield pr
        yield user_update
        user_period['num_of_co_repos'] = len(contributed_repo)
        user_period['num_of_commits'] = user_update['total_commits']
        user_period['num_of_PRs'] = user_update['total_PRs']
        user_period['num_of_issues'] = user_update['total_issues']
        yield user_period
        for repo in owned_repo:
            contribute = RepoContribute()
            contribute['github_id'] = github_id
            contribute['owner_id'], contribute['repo_name'] = repo
            yield contribute
            yield self.api_get(f'repos/{"/".join(repo)}', self.parse_repo, metadata={'from': github_id})
        for repo in contributed_repo:
            contribute = RepoContribute()
            contribute['github_id'] = github_id
            contribute['owner_id'], contribute['repo_name'] = repo
            yield contribute
            yield self.api_get(f'repos/{"/".join(repo)}', self.parse_repo, metadata={'from': github_id})

    def parse_user_page(self, res):
        self.driver.get(res.url)
        WebDriverWait(self.driver, 1).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'h2.h4.mb-2'))
        )
        html = self.driver.page_source
        soup = BeautifulSoup(html, 'html.parser')
        # soup = BeautifulSoup(res.body, 'html.parser')
        info_list = [tag.parent for tag in soup.select('h2.h4.mb-2')]
        user_data = UserUpdate()
        user_data['github_id'] = res.meta['github_id']
        user_data['target'] = 'badge'
        user_data['achievements'] = None
        user_data['highlights'] = None
        for info in info_list:
            if info.h2.text == 'Achievements':
                user_data['achievements'] = ', '.join(
                    [tag['alt'] for tag in info.select('img')]
                )
            if info.h2.text == 'Highlights':
                user_data['highlights'] = ', '.join(
                    [tag.text.strip() for tag in info.select('li')]
                )
        yield user_data

    def parse_user_following(self, res):
        json_data = json.loads(res.body)
        github_id = res.meta['github_id']
        for following in json_data:
            user_following = UserFollowing(
                github_id=github_id,
                following_id=following['login']
            )
            yield user_following

        if len(json_data) == 100:
            metadata = res.meta
            metadata['page'] += 1
            yield self.api_get(
                f'users/{github_id}/following',
                self.parse_user_following,
                metadata,
                page=metadata['page']
            )

    def parse_user_starred(self, res):
        json_data = json.loads(res.body)
        github_id = res.meta['github_id']
        for starred in json_data:
            user_starred = UserStarred(
                github_id=github_id,
                starred_repo_owner=starred['owner']['login'],
                starred_repo_name=starred['name']
            )
            yield user_starred

        if len(json_data) == 100:
            metadata = res.meta
            metadata['page'] += 1
            yield self.api_get(
                f'users/{github_id}/starred',
                self.parse_user_starred,
                metadata,
                page=metadata['page']
            )

    def parse_user_repo(self, res):
        json_data = json.loads(res.body)
        user_data = UserUpdate()
        github_id = res.meta['github_id']
        user_data['github_id'] = github_id
        user_data['target'] = 'repo_star'
        user_data['stars'] = 0
        for repo_data in json_data:
            user_data['stars'] += repo_data['stargazers_count']
        yield user_data
        if len(json_data) == 100:
            metadata = res.meta
            metadata['page'] += 1
            yield self.api_get(
                f'users/{github_id}/repos',
                self.parse_user_repo,
                metadata,
                page=metadata['page']
            )

    def parse_repo(self, res):
        json_data = json.loads(res.body)
        repo_data = Repo()
        github_id = json_data['owner']['login']
        repo_name = json_data['name']
        repo_data['github_id'] = github_id
        repo_data['repo_name'] = repo_name
        repo_data['path'] = f'{github_id}/{repo_name}'
        repo_data['stargazers_count'] = json_data['stargazers_count']
        repo_data['forks_count'] = json_data['forks_count']
        repo_data['watchers_count'] = None if not 'subscribers_count' in json_data else json_data['subscribers_count']
        repo_data['create_date'] = datetime.fromisoformat(
            json_data['created_at'][:-1])
        repo_data['update_date'] = datetime.fromisoformat(
            json_data['updated_at'][:-1])
        repo_data['language'] = json_data['language']
        repo_data['proj_short_desc'] = json_data['description']
        repo_data['license'] = None if json_data['license'] is None else json_data['license']['name']
        yield repo_data

        yield scrapy.Request(
            f'{HTML_URL}/{github_id}/{repo_name}',
            self.parse_repo_page,
            meta={'github_id': github_id, 'repo_name': repo_name,
                  'from': res.meta['from']},
            dont_filter=True
        )

    def parse_repo_page(self, res):
        print("parse_repo_page")
        soup = BeautifulSoup(res.body, 'html.parser')
        github_id = res.meta['github_id']
        repo_name = res.meta['repo_name']
        repo_data = RepoUpdate()
        repo_path = f'{github_id}/{repo_name}'
        repo_data['path'] = repo_path
        release_tag = soup.select_one(f'a[href="/{repo_path}/releases"]')
        if not release_tag is None:
            release_tag = release_tag.parent.parent
            release_counter = release_tag.select_one('span.Counter')
            if not release_counter is None:
                try:
                    release_cnt = release_counter.text.replace(
                        ',', '').replace('+', '')
                    repo_data['release_count'] = int(release_cnt)
                except ValueError:
                    repo_data['release_count'] = 0
                repo_data['release_ver'] = release_tag.select_one(
                    'a > div span').text[:45]
            else:
                repo_data['release_ver'] = None
                repo_data['release_count'] = 0
        else:
            repo_data['release_ver'] = None
            repo_data['release_count'] = 0
        contributor_tag = soup.select_one(
            f'a[href="/{github_id}/{repo_name}/graphs/contributors"]')
        if not contributor_tag is None:
            try:
                contributor_tag = contributor_tag.parent.parent
                contributor_counter = contributor_tag.select_one(
                    'span.Counter')
                contributors_cnt = contributor_counter.text.replace(
                    ',', '').replace('+', '')
                repo_data['contributors_count'] = int(contributors_cnt)
            except ValueError:
                repo_data['contributors_count'] = 1
        else:
            repo_data['contributors_count'] = 1
        repo_data['readme'] = not soup.select_one(
            'a[title="README.md"]') is None
        print(repo_name)
        print(repo_data['readme'])
        repo_data['commits_count'] = 0
        try:
            div_elements = soup.find_all('div', class_='d-flex gap-2')
            # 각 div 요소 안의 '2 Commits'가 있는 span 요소 선택 및 출력
            for div_element in div_elements:
                commits_span = div_element.select_one(
                    'span[data-component="text"] > span')
                if commits_span:
                    commits_text = commits_span.text
                    commits_cnt = commits_text.split()[0].replace(',', '')
                    repo_data['commits_count'] = int(commits_cnt)
        except ValueError:
            repo_data['commits_count'] = 0
            logging.info(f"commits_count ValueError: {repo_path}")
        yield repo_data
        print(f'repos/{github_id}/{repo_name}/commits')
        print(repo_path)
        print(res.meta['from'])
        yield scrapy.Request(
            f'{HTML_URL}/{repo_path}/pulls',
            self.parse_repo_pr,
            meta={'path': repo_path}
        )
        yield scrapy.Request(
            f'{HTML_URL}/{repo_path}/issues',
            self.parse_repo_issue,
            meta={'path': repo_path}
        )
        yield self.api_get(
            f'repos/{github_id}/{repo_name}/commits',
            self.parse_repo_commit, {'path': repo_path,
                                     'page': 1, 'from': res.meta['from']}
        )

        yield scrapy.Request(
            f'{HTML_URL}/{repo_path}/network/dependencies',
            self.parse_repo_dependencies,
            meta={'path': repo_path}
        )

    def parse_repo_pr(self, res):
        soup = BeautifulSoup(res.body, 'html.parser')
        repo_data = RepoUpdate()
        repo_data['path'] = res.meta['path']
        prs_cnt = soup.select_one(
            'a[data-ga-click="Pull Requests, Table state, Open"]').parent
        prs_cnt = [x.text.strip().replace(',', '').split()
                   for x in prs_cnt.select('a')]
        repo_data['prs_count'] = int(prs_cnt[0][0]) + int(prs_cnt[1][0])
        yield repo_data

    def parse_repo_issue(self, res):
        soup = BeautifulSoup(res.body, 'html.parser')
        repo_data = RepoUpdate()
        repo_data['path'] = res.meta['path']
        issue_cnt = soup.select_one(
            'a[data-ga-click="Issues, Table state, Open"]').parent
        issue_cnt = [x.text.strip().replace(',', '').split()
                     for x in issue_cnt.select('a')]
        repo_data['open_issue_count'] = int(issue_cnt[0][0])
        repo_data['close_issue_count'] = int(issue_cnt[1][0])
        yield repo_data

    def parse_repo_commit(self, res):
        json_data = json.loads(res.body)
        path = res.meta['path']
        for commits in json_data:
            committer = commits['committer']
            if committer is not None and 'login' in committer:
                committer = committer['login']
            author = commits['author']
            if author is not None and 'login' in author:
                author = author['login']
            if author == res.meta['from'] or author == res.meta['from']:
                yield self.api_get(
                    f'repos/{path}/commits/{commits["sha"]}',
                    self.parse_repo_commit_edits,
                    {'path': res.meta['path']}
                )

        if len(json_data) == 100:
            metadata = res.meta
            metadata['page'] += 1
            yield self.api_get(
                f'repos/{path}/commits',
                self.parse_repo_commit,
                metadata,
                page=metadata['page']
            )

    def parse_repo_commit_edits(self, res):
        json_data = json.loads(res.body)
        commit_data = RepoCommit()
        commit_data['github_id'] = res.meta['path'].split('/')[0]
        commit_data['repo_name'] = res.meta['path'].split('/')[1]
        commit_data['sha'] = json_data['sha']
        committer = json_data['committer']
        if committer is None or 'login' not in committer:
            commit_data['committer_github'] = None
        else:
            commit_data['committer_github'] = committer['login']
        commit_data['committer_date'] = datetime.fromisoformat(
            json_data['commit']['committer']['date'][:-1])
        commit_data['committer'] = json_data['commit']['committer']['email']
        author = json_data['author']
        if author is None or 'login' not in author:
            commit_data['author_github'] = None
        else:
            commit_data['author_github'] = author['login']
        commit_data['author_date'] = datetime.fromisoformat(
            json_data['commit']['author']['date'][:-1])
        commit_data['author'] = json_data['commit']['author']['email']
        commit_data['additions'] = json_data['stats']['additions']
        commit_data['deletions'] = json_data['stats']['deletions']
        yield commit_data
        for file in json_data['files']:
            commit_file = RepoCommitFile()
            commit_file['github_id'] = res.meta['path'].split('/')[0]
            commit_file['repo_name'] = res.meta['path'].split('/')[1]
            commit_file['sha'] = json_data['sha']
            commit_file['filename'] = file['filename']
            commit_file['status'] = file['status']
            commit_file['additions'] = file['additions']
            commit_file['deletions'] = file['deletions']
            yield commit_file

    def parse_repo_dependencies(self, res):
        soup = BeautifulSoup(res.body, 'html.parser')
        repo_data = RepoUpdate()
        repo_data['path'] = res.meta['path']
        repo_data['dependencies'] = 0
        for tag in soup.select('.Box .Counter'):
            repo_data['dependencies'] = max(
                repo_data['dependencies'], int(tag.text.replace(',', '')))
        yield repo_data
