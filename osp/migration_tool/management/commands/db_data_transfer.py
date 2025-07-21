from django.core.management.base import BaseCommand
import requests
from user.models import StudentTab, Account, UserAccount, GithubAccount
from django.utils.timezone import now
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = '기존 account, student_tab 데이터를 기반으로 user_account와 github_account 생성'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--github-token',
            type=str,
            required=True,
            help='GitHub API 토큰 (필수)'
        )
    
    def handle(self, *args, **kwargs):
        github_token = kwargs['github_token']
        
        # API 요청 헤더에 토큰 추가
        headers = {
            'Authorization': f'token {github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        accounts = Account.objects.select_related('student_data', 'user')
        
        for acc in accounts:
            student = acc.student_data
            if not student:
                self.stdout.write(self.style.WARNING(f"계정 {acc.github_id}는 student_data 없음"))
                continue
            UserAccount.objects.filter(student_id=student.id).delete()
            # UserAccount 생성
            ua = UserAccount(
                student_id=str(student.id),
                date_joined=acc.user.date_joined if acc.user.date_joined else now(),
                role=0,
                name=student.name,
                college=student.college,
                dept=student.dept,
                last_login=acc.user.last_login,
                is_active=1 if acc.user.is_active else 0,
                photo=acc.photo,
                introduction=acc.introduction,
                portfolio=acc.portfolio,
                plural_major=student.plural_major,
                absence=student.absence
            )
            ua.save()
            
            # GithubAccount 생성
            if acc.github_id:
                try:
                    response = requests.get(
                        f"https://api.github.com/users/{acc.github_id}",
                        headers=headers,
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        # id 값이 GitHub 고유 ID (정수)
                        github_id_value = data.get('id')
                        GithubAccount.objects.filter(
                            github_id=github_id_value
                        ).delete()
                        # GithubAccount 저장
                        ga = GithubAccount(
                            github_id=github_id_value,
                            student=ua,
                            github_login=data.get('login'),
                            github_name=data.get('name'),
                            github_email=student.primary_email,
                            last_crawling=None
                        )
                        ga.save()
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"✅ 성공: {acc.github_id} 계정 처리 완료"
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f"❗ API 요청 실패: {acc.github_id} ({response.status_code})"
                            )
                        )
                        if response.status_code == 401:
                            self.stdout.write(
                                self.style.ERROR("토큰이 유효하지 않거나 만료되었습니다.")
                            )
                        elif response.status_code == 403:
                            self.stdout.write(
                                self.style.ERROR("API 요청 한도가 초과되었습니다.")
                            )

                except requests.RequestException as e:
                    self.stdout.write(
                        self.style.ERROR(f"❗ 네트워크 오류: {acc.github_id} - {str(e)}")
                    )