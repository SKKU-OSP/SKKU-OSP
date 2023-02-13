from django.db import DatabaseError, transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import views as auth_views
from django.contrib.auth.models import User
from user.models import StudentTab, Account, AccountInterest, AccountPrivacy
from tag.models import Tag
from data.api import GitHub_API
from crawler.Scrapy.SKKU_GitHub.configure import OAUTH_TOKEN
import re

class PasswordResetView(auth_views.PasswordResetView):

    def form_valid(self, form):
        try:
            username = self.request.POST.get("username")
            email = self.request.POST.get("email")

            if Account.objects.filter(user__username=username, student_data__personal_email=email).exists():
                opts = {
                    'use_https': self.request.is_secure(),
                    'token_generator': self.token_generator,
                    'from_email': self.from_email,
                    'email_template_name': self.email_template_name,
                    'subject_template_name': self.subject_template_name,
                    'request': self.request,
                    'html_email_template_name': self.html_email_template_name,
                    'extra_email_context': self.extra_email_context,
                }
                form.save(**opts)
                return super().form_valid(form)
            else:
                return render(self.request, 'common/password_reset_done_fail.html')
        except Exception as e:
            print("form_valid fail", e)
            return render(self.request, 'common/password_reset_done_fail.html')
        

def register_page(request):
    if request.method == 'GET':
        return render(request, 'common/register.html')
    if request.method == 'POST':
        fail_reason = []
        if len(request.POST.get('username')) < 5:
            fail_reason.append('username은 5자 이상이여야 합니다.')
        if request.POST['password-check'] != request.POST['password']:
            fail_reason.append('password가 일치하지 않습니다.')
        if not re.match('[0-9]{10}', request.POST['student-id']) :
            fail_reason.append('학번 형식이 다릅니다.')
        if len(request.POST['name']) > 20:
            fail_reason.append('이름은 20자를 넘을 수 없습니다.')
        if len(request.POST['dept']) > 45:
            fail_reason.append('학과은 45자를 넘을 수 없습니다.')
        if len(request.POST['personal-email']) > 100:
            fail_reason.append('이메일 주소는 100자를 넘을 수 없습니다.')
        if len(request.POST['primary-email']) > 100:
            fail_reason.append('이메일 주소는 100자를 넘을 수 없습니다.')
        if len(request.POST['secondary-email']) > 100:
            fail_reason.append('이메일 주소는 100자를 넘을 수 없습니다.')
        if check_duplicate_username(request.POST.get('username')):
            fail_reason.append('중복된 이름이 있습니다.\n')

        personal_email=request.POST['personal-email'] + "@" + request.POST['personal-email-domain']
        primary_email=request.POST['primary-email'] + "@" +  request.POST['primary-email-domain']
        secondary_email=request.POST['secondary-email'] + "@" +  request.POST['secondary-email-domain']
        try:
            if check_email(personal_email):
                fail_reason.append('연락용 이메일이 형식에 맞지 않습니다. ' + personal_email)
            if check_email(primary_email):
                fail_reason.append('GitHub 이메일이 형식에 맞지 않습니다. ' + primary_email)
            if check_email(secondary_email):
                fail_reason.append('기타 연동 이메일이 형식에 맞지 않습니다. ' + secondary_email)
        except:
            fail_reason.append('이메일이 형식에 맞지 않습니다.')


        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        try:
            with transaction.atomic():
                user = User.objects.create_user(username=request.POST.get('username'), password=request.POST['password'])
                user.save()
                student_data = StudentTab.objects.create(
                    id=request.POST['student-id'],
                    name=request.POST['name'],
                    college=request.POST['college'],
                    dept=request.POST['dept'],
                    github_id=request.POST['github-id'],
                    absence=request.POST['absence'],
                    plural_major=request.POST['plural-major'],
                    personal_email=request.POST['personal-email'],
                    primary_email=request.POST['primary-email'],
                    secondary_email=request.POST['secondary-email']
                )
                student_data.save()
                new_account = Account.objects.create(user=user, student_data=student_data)
                new_account.save()
                tag_list = request.POST.get('category_tag_list', '').split(',')
                for tag in tag_list:
                    tag = Tag.objects.filter(name=tag)
                    if len(tag) == 1:
                        AccountInterest.objects.create(account=new_account, tag=tag[0])

                new_privacy = AccountPrivacy.objects.create(
                    account=new_account,
                    open_lvl=request.POST['radio-3'],
                    is_write=request.POST['radio-1'],
                    is_open=request.POST['radio-2']
                )
                new_privacy.save()
        except DatabaseError as e:
            print('데이터베이스 오류.', e)
            fail_reason.append(e)
        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        return JsonResponse({'status': 'success'})
    
def check_user(request):
    if request.method == 'POST':
        fail_reason = []
        username = request.POST.get('username')
        if len(username) < 5:
            fail_reason.append('username은 5자 이상이여야 합니다.')
        
        if check_duplicate_username(username):
            fail_reason.append('중복된 이름이 있습니다.')
        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        
        return JsonResponse({'status': 'success'})
    
def check_github_id(request):
    if request.method == 'POST':
        fail_reason = []
        github_id = request.POST.get('github-id')
        
        if len(github_id) == 0:
            fail_reason.append('GitHub ID를 입력해주세요.')
        if check_duplicate_github_id(github_id):
            fail_reason.append('중복된 아이디가 있습니다.')
        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        if not check_api_github(github_id):
            fail_reason.append('GitHub ID를 확인할 수 없습니다.')
        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        return JsonResponse({'status': 'success'})
    
def check_duplicate_username(username):
    user = User.objects.filter(username=username)
    return True if len(user) else False

def check_duplicate_github_id(github_id):
    acc = Account.objects.filter(student_data__github_id=github_id)
    return True if len(acc) else False

def check_api_github(github_id):
    for auth_token in OAUTH_TOKEN:
        try:
            api = GitHub_API(auth_token)
            result = api.get_user(github_id)
            print("result id", result['github_id'])
            if result['github_id'] == github_id:
                return True
        except Exception as e:
            print("check error github_id", e)
    
    return False

def check_email(email):
    p = re.compile('^[a-zA-Z0-9+-_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
    print(email, p.match(email) != None)
    return p.match(email) == None
