from github_collector.api.client import GithubApiClient
from typing import List, Dict, Any, Generator
from datetime import datetime
from dateutil.parser import parse

class PullRequestCollector:
    def __init__(self, client: GithubApiClient):
        self.client = client

    def find_all_pull_requests(self, repo_owner: str, repo_name: str, username: str, start_date: str, end_date: str) -> Generator[Dict[str, Any], None, None]:
        """
        특정 레포지토리의 특정 사용자의 모든 PR 목록 조회

        Args:
            repo_owner: 레포지토리 소유자
            repo_name: 레포지토리 이름
            username: 사용자 이름
            start_date: 수집 시작 날짜 (YYYY-MM-DD) 기본값: 2019-01-01
            end_date: 수집 종료 날짜 (YYYY-MM-DD) 기본값: 오늘 날짜

        """
        
        if not start_date:
            start_date = '2019-01-01'


        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')

        query = f"repo:{repo_owner}/{repo_name} author:{username} created:{start_date}..{end_date} type:pr"

        for pr in self.client._paginate(
            endpoint=f'/search/issues',
            params={
                "q": query,
            },
            data_extractor=lambda x: x.get('items', [])
        ):
            pr_data = {
                'id': pr['id'],
                'repo_owner_id': repo_owner,
                'repo_name': repo_name,
                'pr_number': pr['number'],
                'author_name': username,
                'pr_title': pr['title'],
                'pr_date': parse(pr['created_at']).date(),
            }
            yield pr_data