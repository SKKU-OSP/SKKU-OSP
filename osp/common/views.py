from django.db import DatabaseError, transaction
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import views as auth_views, login, authenticate
from django.contrib.auth.models import User
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse_lazy, reverse
from django.views.generic.base import TemplateView
from django.template import loader
from django.core.mail import EmailMultiAlternatives

from osp.settings import EMAIL_HOST_USER, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
from user.models import StudentTab, Account, AccountInterest, AccountPrivacy
from tag.models import TagIndependent
from data.api import GitHub_API
from crawler.Scrapy.SKKU_GitHub.configure import OAUTH_TOKEN_FOR_REG

import re
import smtplib
import requests

class LoginView(auth_views.LoginView):
    template_name='common/login.html'
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        GITHUB_LOGIN_URL = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}" if GITHUB_CLIENT_ID else None
        context.update({"type": 'sign', "GITHUB_LOGIN_URL": GITHUB_LOGIN_URL})
        return context

    def get_success_url(self):
        # ADMIN은 통계페이지로 이동
        if self.request.user.is_superuser:
            return reverse('home:statistic')
        # 프로필페이지로 리다이렉트
        return reverse_lazy('user:profile', args=[self.request.user.username])

    def form_valid(self, form):
        # 로그인 처리
        response = super().form_valid(form)
        # 로그인 후에 리다이렉트 처리
        return redirect(self.get_success_url())

def github_login_callback(request):
    code = request.GET.get('code')
    if code is None:
        return redirect(reverse('common:login'))
    access_token = get_access_token(code)
    if access_token is None:
        context = {"alert": "GitHub에서 access_token을 얻지 못했습니다.", "url":reverse('common:login')}
        return render(request, "community/redirect.html", context)
    primary_email = get_user_primary_email(access_token)
    print("primary_email", primary_email)
    user_info = get_user_info(access_token)
    print("user_info", user_info)
    
    if user_info is None:
        context = {"alert": "GitHub에서 유저 정보를 얻지 못했습니다.", "url":reverse('common:login')}
        return render(request, "community/redirect.html", context)
    account = Account.objects.filter(github_id=user_info['username'])
    if account.exists():
        try:
            user_account = account.first()
            user = User.objects.get(id=user_account.user_id)
            login(request, user)
            return redirect(reverse('user:profile', args=[user.username]))
        except Exception as e:
            print("GitHub Login Fail", e)
            context = {'type': 'sign', 'username':user_info['username'], 'personal_email':user_info['email'], 'primary_email':primary_email}
            if context['personal_email']:
                context['personal_email_username'], context['personal_email_domain'] = context['personal_email'].split('@')
            if context['primary_email']:
                context['primary_email_username'], context['primary_email_domain'] = primary_email.split('@')
            context['msg'] = f'GitHub Login에 실패했습니다. 계정이 있는데 문제가 발생했다면 {EMAIL_HOST_USER} 로 문의해주시기 바랍니다.'
            return render(request, 'common/register.html', context)
    else:
        context = {'type': 'sign', 'username':user_info['username'], 'personal_email':user_info['email'], 'primary_email':primary_email}
        if context['personal_email']:
            context['personal_email_username'], context['personal_email_domain'] = context['personal_email'].split('@')
        if context['primary_email']:
            context['primary_email_username'], context['primary_email_domain'] = primary_email.split('@')
        context["msg"] = f'SOSD에 와주셔서 감사합니다! GitHub 정보 외의 추가 정보를 입력하고 가입해주세요!'
        return render(request, 'common/register.html', context)

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
        REDIRECT_URL = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}" if GITHUB_CLIENT_ID else reverse('common:login')
        return redirect(REDIRECT_URL)
    if request.method == 'POST':
        fail_reason = []
        if len(request.POST.get('username')) < 5:
            fail_reason.append('Username은 5자 이상이여야 합니다.')
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
            fail_reason.append('중복된 Username이 있습니다.\n')
        if check_duplicate_student_id(request.POST['student-id']):
            fail_reason.append('중복된 학번이 있습니다.\n')

        personal_email=request.POST['personal-email'] + "@" + request.POST['personal-email-domain']
        primary_email=request.POST['primary-email'] + "@" + request.POST['primary-email-domain']
        secondary_email=request.POST['secondary-email'] + "@" + request.POST['secondary-email-domain']
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
                new_account = Account.objects.create(user=user, student_data=student_data, github_id=request.POST['github-id'])
                new_account.save()
                tag_list = request.POST.get('category_tag_list', '').split(',')
                for tag in tag_list:
                    tag = TagIndependent.objects.filter(name=tag)
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

# 회원가입 페이지에서 Username Check 버튼 누를 때 유효성 확인
def check_user(request):
    if request.method == 'POST':
        fail_reason = []
        username = request.POST.get('username')
        if len(username) < 5:
            fail_reason.append('Username은 5자 이상이여야 합니다.')
        if check_duplicate_username(username):
            fail_reason.append('중복된 Username이 있습니다.')
        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        
        return JsonResponse({'status': 'success'})

# 회원가입 페이지에서 GitHub Username Check 버튼 누를 때 유효성 확인
def check_github_id(request):
    if request.method == 'POST':
        fail_reason = []
        github_id = request.POST.get('github-id')
        
        if len(github_id) == 0:
            fail_reason.append('GitHub Username을 입력해주세요.')
        if check_duplicate_github_id(github_id):
            fail_reason.append('중복된 아이디가 있습니다.')
        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        if not check_api_github(github_id):
            fail_reason.append('GitHub Username을 확인할 수 없습니다.')
        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        return JsonResponse({'status': 'success'})

# 회원가입 페이지에서 학번 Check 버튼 누를 때 학번 유효성 확인
def check_student_id(request):
    if request.method == 'POST':
        fail_reason = []
        student_id = request.POST['student-id']

        if not re.match('[0-9]{10}', student_id) :
            fail_reason.append('학번 형식이 다릅니다.')
        if check_duplicate_student_id(student_id) :
            fail_reason.append('중복된 학번이 있습니다.')
        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        return JsonResponse({'status': 'success'})

def check_duplicate_username(username):
    user = User.objects.filter(username=username)
    return True if len(user) else False

def check_duplicate_github_id(github_id):
    acc = Account.objects.filter(student_data__github_id=github_id)
    return True if len(acc) else False

def check_duplicate_student_id(student_id):
    student = StudentTab.objects.filter(id=student_id)
    return True if len(student) else False

def check_api_github(github_id):
    for auth_token in OAUTH_TOKEN_FOR_REG:
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


def get_access_token(code):
    try:
        github_data = {"code":code}
        github_data["client_id"] = GITHUB_CLIENT_ID
        github_data["client_secret"] = GITHUB_CLIENT_SECRET

        HEADERS = {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        res = requests.post(
                    'https://github.com/login/oauth/access_token', 
                    data=github_data, headers=HEADERS)
        if res.status_code == 200:
            access_token = res.json()['access_token']
            refresh_token = res.json()['refresh_token']
            print('access_token', access_token)
            print('refresh_token', refresh_token)
            return access_token
        else:
            print("status error", res.status_code)
            return None
    except Exception as e:
        print("get_access_token error", e)
        return None
    

def get_user_info(access_token):
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        print('headers', headers)
        res = requests.get('https://api.github.com/user', headers=headers)
        if res.status_code == 200:
            user_data = res.json()
            username = user_data['login']
            email = user_data['email'] if 'email' in user_data else None
            user_info = {'username': username, 'email': email}

            return user_info
        else:
            print("status error", res.status_code)
            return None
    except Exception as e:
        print("get_user_info error", e)
        return None

def get_user_primary_email(access_token):
    headers = {'Authorization': f'token {access_token}'}
    res = requests.get('https://api.github.com/user/emails', headers=headers)
    primary_email = None

    if res.status_code == 200:
        emails = res.json()
        
        for email in emails:
            if email['primary']:
                primary_email = email['email']
                break
    else:
        print("status error", res.status_code)

    return primary_email
