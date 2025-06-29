from github_collector.api.client import GithubApiClient
from typing import List, Dict, Any, Generator

class RepositoryCollector:
    def __init__(self, client: GithubApiClient):
        self.client = client

    def find_all_repositories(self, username: str) -> Generator[str, None, None]:
        """
        사용자가 보유한 모든 레포지토리 목록 조회
        """
        seen = set()
        for repo in self.find_public_repositories(username):
            if repo not in seen:
                seen.add(repo)
                yield repo

        for repo in self.find_contribute_repositories(username):
            if repo not in seen:
                seen.add(repo)
                yield repo

        for repo in self.find_organization_repositories(username):
            if repo not in seen:
                seen.add(repo)
                yield repo

        # yield from self.find_public_repositories(username)
        # yield from self.find_contribute_repositories(username)
        # yield from self.find_organization_repositories(username)

    def find_public_repositories(self, username: str) -> Generator[str, None, None]:
        """
        사용자가 보유한 공개 레포지토리 목록 조회

        Args:
            owner: 사용자 이름

        Returns:
            List[Dict[str, Any]]: 레포지토리 정보 목록
        """

        # 사용자가 보유/기여한 공개 레포지토리 목록 조회 (github profile에서 보이는 레포지토리)
        for item in self.client._paginate(
            endpoint=f'/users/{username}/repos',
            params={
                'type': 'all',
            }
        ):
            yield item['full_name']

    def find_contribute_repositories(self, username: str) -> Generator[str, None, None]:
        """
        사용자가 보유하지 않은 레포 중 기여한 레포지토리 목록 조회

        Args:
            owner: 사용자 이름

        Returns:
            List[Dict[str, Any]]: 레포지토리 정보 목록
        """

        # 1. pr로 기여한 레포지토리 탐색
        for item in self.client._paginate(
            endpoint=f'/search/issues',
            params={
                'q': f'author:{username} type:pr',
            }
        ):
            repo_name = item["repository_url"].replace("https://api.github.com/repos/", "")
            yield repo_name
        
        # 2. commit으로 기여한 레포지토리 탐색
        for item in self.client._paginate(
            endpoint=f'/search/commits',
            params = {'q': f'author:{username}', 'sort': 'author-date', 'order': 'desc'},
            headers = {'Accept': 'application/vnd.github.cloak-preview'}
        ):
            if 'repository' in item:
                yield item['repository']['full_name']
        
        # # 3. issue로 기여한 레포지토리 탐색
        # # 이건 기여한 레포로 봐야하나..?
        # for item in self.client._paginate(
        #     endpoint=f'/search/issues',
        #     params = {'q': f'author:{username} type:issue'}
        # ):
        #     yield item["repository_url"].replace("https://api.github.com/repos/", "")

        # 4. 공개 이벤트로 기여한 레포지토리 탐색
        
        for item in self.client._paginate(
            endpoint=f'/users/{username}/events/public'
        ):
            if 'repo' in item:
                yield item['repo']['name']

    def find_organization_repositories(self, username: str) -> Generator[str, None, None]:
        """
        소속된 조직 중에서 기여한 레포지토리 목록 조회
        """

        # 소속된 조직 목록 조회
        orgs = self.client._request(
            method='GET',
            endpoint=f'/users/{username}/orgs'
        )
        # 조직 목록 중에서 본인이 기여한 레포지토리 탐색
        for org in orgs.json():
            # 각 조직의 레포 조회
            org_repos = self.client._request(
                method='GET',
                endpoint=f'/orgs/{org["login"]}/repos'
            )
            for repo in org_repos.json():
                # 각 레포지토리의 기여자 확인 후 username과 일치하면 레포지토리 추가
                repo_full_name = repo["full_name"]
                repo_contributors_url = f"/repos/{repo_full_name}/contributors"
                repo_contributors = self.client._request(
                    method='GET',
                    endpoint=repo_contributors_url
                )
                for contributor in repo_contributors.json():
                    if contributor["login"] == username:
                        yield repo_full_name