from repository.models import TestGithubPullRequest
from typing import Generator, List, Dict, Any
from itertools import islice

def batch_generator(generator: Generator[Dict[str, Any], None, None], batch_size: int) -> Generator[List[Dict[str, Any]], None, None]:
    while True:
        batch = list(islice(generator, batch_size))
        if not batch:
            break
        yield batch

def save_pull_requests_in_batch(pr_gen: Generator[Dict[str, Any], None, None], batch_size: int = 100):
    """
    특정 레포지토리의 특정 사용자의 PR 목록을 배치 단위로 DB에 저장
    - 이미 존재하는 PR는 제외하고 새로 insert만 수행
    """
    for batch in batch_generator(pr_gen, batch_size):
        pr_objects = []
        
        # 현재 배치에서 PR ID들 추출
        pr_ids = [pr_data['id'] for pr_data in batch]
        
        # 이미 존재하는 PR ID들 확인
        existing_pr_ids = set(
            TestGithubPullRequest.objects.filter(
                id__in=pr_ids
            ).values_list('id', flat=True)
        )
        
        # 새로운 PR만 필터링하여 객체 생성
        for pr_data in batch:
            if pr_data['id'] not in existing_pr_ids:
                pr_objects.append(TestGithubPullRequest(
                    id=pr_data['id'],
                    repo_owner_id=pr_data['repo_owner_id'],
                    repo_name=pr_data['repo_name'],
                    pr_number=pr_data['pr_number'],
                    author_name=pr_data['author_name'],
                    pr_title=pr_data['pr_title'],
                    pr_date=pr_data['pr_date']
                ))
        
        TestGithubPullRequest.objects.bulk_create(pr_objects)