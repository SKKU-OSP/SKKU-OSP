from django.core.management.base import BaseCommand
from github_collector.collectors.repository import RepositoryCollector
from github_collector.api.client import GithubApiClient
from github_collector.services.repository_service import save_repositories_in_batch


class Command(BaseCommand):
    help = "특정 사용자의 GitHub 레포지토리를 수집하고 저장합니다."

    def add_arguments(self, parser):
        parser.add_argument('--user', required=True, type=str, help='GitHub 사용자 이름')

    def handle(self, *args, **options):
        username = options['user']
        self.stdout.write(f"GitHub 사용자 이름: {username}")
        
        try:
            client = GithubApiClient()
            collector = RepositoryCollector(client)
            repo_gen = collector.find_all_repositories(username)
            for repo in repo_gen:
                print(repo)
            save_repositories_in_batch(username, repo_gen)
            self.stdout.write(f"레포지토리 수집 완료: {username}")
        except Exception as e:
            self.stderr.write(f"오류 발생: {e}")
            raise