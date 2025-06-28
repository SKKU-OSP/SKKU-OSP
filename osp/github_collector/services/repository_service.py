from github_collector.collectors.repository import RepositoryCollector
from repository.models import TestGithubRepository
from typing import Generator, List, Tuple
from itertools import islice
from django.db.models import Q

def batch_generator(generator: Generator[str, None, None], batch_size: int) -> Generator[List[str], None, None]:
    while True:
        batch = list(islice(generator, batch_size))
        if not batch:
            break
        yield batch

def save_repositories_in_batch(username: str, repo_gen: Generator[str, None, None], batch_size: int = 100):
    """
    레포지토리 목록을 배치 단위로 DB에 저장
    - 이미 존재하는 레포는 제외하고 새로 insert만 수행
    """
    for batch in batch_generator(repo_gen, batch_size):
        repo_objects = []
        key_tuples: List[Tuple[str, str, str]] = []

        for repo_full_name in batch:
            try:
                owner_name, repo_name = repo_full_name.split('/')
                key_tuples.append((owner_name, repo_name, username))
            except ValueError:
                continue

        # 정확한 튜플 기반의 중복 필터링을 위해 Q 객체 조합
        query = Q()
        for owner, repo, github_id in key_tuples:
            query |= Q(owner_name=owner, repo_name=repo, github_id=github_id)

        # DB에 이미 존재하는 키 조회
        existing_keys = set()
        if query:
            existing_keys = set(
                TestGithubRepository.objects
                .filter(query)
                .values_list('owner_name', 'repo_name', 'github_id')
            )

        # 존재하지 않는 경우만 insert 대상으로 선정
        for owner, repo, github_id in key_tuples:
            if (owner, repo, github_id) not in existing_keys:
                repo_objects.append(TestGithubRepository(
                    owner_name=owner,
                    repo_name=repo,
                    github_id=github_id,
                ))

        TestGithubRepository.objects.bulk_create(repo_objects)
