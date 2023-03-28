from django.db import DatabaseError, transaction
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import views as auth_views
from django.contrib.auth.models import User
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse_lazy, reverse
from django.views.generic.base import TemplateView
from django.template import loader
from django.core.mail import EmailMultiAlternatives

from osp.settings import EMAIL_HOST_USER
from user.models import StudentTab, Account, AccountInterest, AccountPrivacy
from tag.models import Tag
from data.api import GitHub_API
from crawler.Scrapy.SKKU_GitHub.configure import OAUTH_TOKEN

import re
import smtplib

class LoginView(auth_views.LoginView):
    template_name='common/login.html'
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({"type": 'sign'})
        return context

class PasswordResetView(auth_views.PasswordResetView):
    template_name='common/password_reset.html'
    email_template_name = "registration/email_reset_password.html"
    subject_template_name = "registration/subject_reset_password.txt"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({"type": 'sign'})
        return context

    def form_valid(self, form):
        try:
            username = self.request.POST.get("username")
            email = self.request.POST.get("email")

            if Account.objects.filter(user__username=username, student_data__personal_email=email).exists():
                return super().form_valid(form)
            else:
                return render(self.request, 'common/password_reset_done_fail.html', context={"type": 'sign'})
        except Exception as e:
            print("form_valid fail", e)
            return render(self.request, 'common/password_reset_done_fail.html', context={"type": 'sign'})

class PasswordResetDoneView(auth_views.PasswordResetDoneView):
    # 비밀번호 초기화 메일 전송 완료창
    template_name = 'common/password_reset_done.html'
    success_url = reverse_lazy('common:password_reset_done')
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({"type": 'sign'})
        return context

class PasswordResetConfirmView(auth_views.PasswordResetConfirmView):
    # 비밀번호 재설정창
    template_name='common/password_reset_confirm.html'
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({"type": 'sign'})
        return context

class PasswordResetCompleteView(auth_views.PasswordResetCompleteView):
    # 비밀번호 변경 완료
    template_name = 'common/password_reset_complete.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update({"type": 'sign'})
        return context

def send_mail(
    subject_template_name,
    email_template_name,
    context,
    from_email,
    to_email,
):
    """
    Send a django.core.mail.EmailMultiAlternatives to `to_email`.
    """

    # subject는 이메일 제목
    subject = loader.render_to_string(subject_template_name, context)
    # Email subject *must not* contain newlines
    subject = "".join(subject.splitlines())
    body = loader.render_to_string(email_template_name, context)
    email_message = EmailMultiAlternatives(subject, body, from_email, [to_email])
    email_message.send()

class AccountFindView(TemplateView):
    def get(self, request, *args, **kwargs):
        template_name = 'common/account_find.html'
        return render(request, template_name, {'type': 'sign'})

class AccountFindDoneView(TemplateView):
    def get(self, request, *args, **kwargs):
        template_name = 'common/account_find_done.html'
        return render(request, template_name, {'type': 'sign'})

def valid_check(request):
    if request.method == 'POST':
        print("valid_check")
        # 폼을 이용해서 계정정보에 이메일이 포함되어있다면 이메일을 보내도록 한다.
        if request.POST['email']:
            try:
                print(request.POST['email'])

                user = User.objects.get(email=request.POST['email'])
                print(user)
                current_site = get_current_site(request=request)
                print("current_site", current_site.name, " domain: ", current_site.domain)
                context = {'user':user, 'site_name':current_site.name, 'domain': current_site.domain}
                send_mail(subject_template_name="registration/subject_find_username.txt",
                        email_template_name="registration/email_find_username.txt",
                        context = context,
                        from_email=EMAIL_HOST_USER,
                        to_email=user.email)
                return JsonResponse({'status':'success'})
            except User.DoesNotExist as de:
                print("valid_check DoesNotExist: ", de)
                return JsonResponse({'status':'fail', 'message':'이메일을 찾을 수 없습니다. 이메일을 확인해주세요.'})
            except smtplib.SMTPServerDisconnected as disconn:
                print("valid_check SMTPServerDisconnected: ", disconn)
                return JsonResponse({'status':'fail', 'message':'죄송합니다. 서비스에 문제가 있어 이메일을 발송할 수 없습니다.'})
            except Exception as e:
                print("valid_check error: ", e, type(e).__name__, e.args)
                return JsonResponse({'status':'fail', 'message':'이메일 발송에 실패했습니다.'})
    return JsonResponse({'status':'fail', 'message':'이메일을 찾을 수 없습니다.'})


def register_page(request):
    if request.method == 'GET':
        context = {'type': 'sign'}
        return render(request, 'common/register.html', context)
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
            if secondary_email.strip() == "@":
                secondary_email = None
        except:
            fail_reason.append('이메일이 형식에 맞지 않습니다.')

        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        try:
            with transaction.atomic():
                user = User.objects.create_user(username=request.POST.get('username'), 
                                                password=request.POST.get('password'), 
                                                email=personal_email)
                user.save()
                student_data = StudentTab.objects.create(
                    id=request.POST['student-id'],
                    name=request.POST['name'],
                    college=request.POST['college'],
                    dept=request.POST['dept'],
                    github_id=request.POST['github-id'],
                    absence=request.POST['absence'],
                    plural_major=request.POST['plural-major'],
                    personal_email=personal_email,
                    primary_email=primary_email,
                    secondary_email=secondary_email
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

def csrf_failure(request, reason=""):
    return redirect(reverse('common:login'))
