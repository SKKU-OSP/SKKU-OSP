from repository.models import TestGithubIssue
from typing import Generator, List, Dict, Any
from itertools import islice

def batch_generator(generator: Generator[Dict[str, Any], None, None], batch_size: int) -> Generator[List[Dict[str, Any]], None, None]:
    while True:
        batch = list(islice(generator, batch_size))
        if not batch:
            break
        yield batch

def save_issues_in_batch(issue_gen: Generator[Dict[str, Any], None, None], batch_size: int = 100):
    """
    특정 레포지토리의 특정 사용자의 Issue 목록을 배치 단위로 DB에 저장
    - 이미 존재하는 Issue는 제외하고 새로 insert만 수행
    """
    for batch in batch_generator(issue_gen, batch_size):
        issue_objects = []
        
        # 현재 배치에서 Issue ID들 추출
        issue_ids = [issue_data['id'] for issue_data in batch]
        
        # 이미 존재하는 Issue ID들 확인
        existing_issue_ids = set(
            TestGithubIssue.objects.filter(
                id__in=issue_ids
            ).values_list('id', flat=True)
        )
        
        # 새로운 Issue만 필터링하여 객체 생성
        for issue_data in batch:
            if issue_data['id'] not in existing_issue_ids:
                issue_objects.append(TestGithubIssue(
                    id=issue_data['id'],
                    repo_owner_id=issue_data['repo_owner_id'],
                    repo_name=issue_data['repo_name'],
                    issue_number=issue_data['issue_number'],
                    author_name=issue_data['author_name'],
                    issue_title=issue_data['issue_title'],
                    issue_date=issue_data['issue_date']
                ))
        
        TestGithubIssue.objects.bulk_create(issue_objects)