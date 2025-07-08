from django.core.management.base import BaseCommand
from github_collector.collectors.pull_request import PullRequestCollector
from github_collector.api.client import GithubApiClient
from github_collector.services.pr_service import save_pull_requests_in_batch


class Command(BaseCommand):
    help = "특정 레포지토리의 특정 사용자의 GitHub PR을 수집하고 저장합니다."

    def add_arguments(self, parser):
        parser.add_argument('--owner', default='SKKU-OSP', type=str, help='레포지토리 소유자 이름')
        parser.add_argument('--repo', default='SKKU-OSP', type=str, help='레포지토리 이름')
        parser.add_argument('--user', default='byungKHee', type=str, help='GitHub 사용자 이름')
        parser.add_argument('--start-date', type=str, help='수집 시작 날짜 (YYYY-MM-DD)')
        parser.add_argument('--end-date', type=str, help='수집 종료 날짜 (YYYY-MM-DD)')

    def handle(self, *args, **options):
        owner = options['owner']
        repo = options['repo']
        username = options['user']
        start_date = options.get('start_date')
        end_date = options.get('end_date')
        
        self.stdout.write(f"레포지토리: {owner}/{repo}")
        self.stdout.write(f"사용자: {username}")
        if start_date:
            self.stdout.write(f"시작 날짜: {start_date}")
        if end_date:
            self.stdout.write(f"종료 날짜: {end_date}")
        
        try:
            client = GithubApiClient()
            collector = PullRequestCollector(client)
            pr_gen = collector.find_all_pull_requests(owner, repo, username, start_date, end_date)
            
            for pr in pr_gen:
                print(pr)
                
            # 다시 generator를 생성해서 저장 (generator는 한 번만 사용 가능)
            pr_gen = collector.find_all_pull_requests(owner, repo, username, start_date, end_date)
            save_pull_requests_in_batch(pr_gen)
            
            self.stdout.write(f"PR 수집 완료: {owner}/{repo} - {username}")
        except Exception as e:
            self.stderr.write(f"오류 발생: {e}")
            raise