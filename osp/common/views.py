from django.db import DatabaseError, transaction
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import views as auth_views, login, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse_lazy, reverse
from django.views.generic.base import TemplateView
from django.template import loader
from django.core.mail import EmailMultiAlternatives
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes


from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from osp.settings import EMAIL_HOST_USER, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
from user.models import StudentTab, Account, AccountInterest, AccountPrivacy
from tag.models import TagIndependent
from tag.serializers import TagIndependentSerializer
from data.api import GitHub_API
from crawler.Scrapy.SKKU_GitHub.settings import OAUTH_TOKEN_FOR_REG
from common.utils import get_fail_res, check_email, get_college_list, check_college, get_consent_text, get_email_domains

import re
import smtplib
import requests
import logging


class LoginView(auth_views.LoginView):
    template_name = 'common/login.html'

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


class JWTLoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        try:
            user = authenticate(request, username=username, password=password)
        except Exception as e:
            logging.exception(f"JWTLoginView 인증 실패: {e}")
            return Response(get_fail_res("인증에 실패했습니다. Username과 password를 다시 확인해주세요."))

        if user is not None:
            # 접속일 업데이트
            login(request, user)

            token = RefreshToken.for_user(user)  # simple jwt로 토큰 발급
            print("access_token", token.access_token)

            account = Account.objects.filter(user=user)
            if account.exists():
                account = account.first()
            else:
                return Response(get_fail_res("계정 정보가 있으나 문제가 있습니다. 관리자에게 문의하세요."))

            data = {
                'user': account.to_json(),
                'access_token': str(token.access_token),
                'refresh_token': str(token),
            }
            return Response({"message": "로그인 성공", "data": data}, status=status.HTTP_200_OK)

        return Response(get_fail_res("GitHub에서 유저 정보를 얻지 못했습니다."), status=status.HTTP_400_BAD_REQUEST)


class GitHubLoginView(APIView):
    def get(self, request):
        code = request.GET.get('code')
        if code is None:
            return Response(get_fail_res("요청에서 code를 얻지 못했습니다."))
        # code 값을 이용해 access_token 발급
        access_token = get_access_token(code)
        if access_token is None:
            return Response(get_fail_res("GitHub에서 access_token을 얻지 못했습니다."))
        # access_token 값을 이용해 github email 조회
        primary_email = get_user_primary_email(access_token)
        print("primary_email", primary_email)
        # access_token 값을 이용해 github 유저 정보 조회
        user_info = get_user_info(access_token)
        print("user_info", user_info)

        if user_info is None:
            return Response(get_fail_res("GitHub에서 유저 정보를 얻지 못했습니다."))

        # account 존재하면 로그인, 없으면 회원가입
        try:
            account = Account.objects.filter(github_id=user_info['username'])
            if account.exists():
                try:
                    # 유저가 존재하면 데이터 조회하여 반환
                    user_account = account.first()
                    user = User.objects.get(id=user_account.user_id)
                    # 접속일 업데이트
                    login(request, user)

                    token = RefreshToken.for_user(user)  # simple jwt로 토큰 발급
                    print("access_token", token.access_token)

                    data = {
                        'user': user_account.to_json(),
                        'access_token': str(token.access_token),
                        'refresh_token': str(token),
                    }
                    return Response({"status": "success", "message": "로그인 성공", "data": data}, status=status.HTTP_200_OK)

                except Exception as e:
                    logging.exception(
                        f"[github_login_callback] user_account {e}")
                    return Response(get_fail_res("GitHub에서 유저 정보를 얻지 못했습니다."), status=status.HTTP_400_BAD_REQUEST)

            else:
                # 회원가입 페이지에 필요한 GitHub username, username, GitHub email
                data = {'github_username': None, 'username': None,
                        "github_email_id": None, "github_email_domain": None,
                        "personal_email_id": None, "personal_email_domain": None}
                data['github_username'] = {
                    "value": user_info['username'], 'readonly': True}
                data['username'] = {
                    "value": user_info['username'], 'readonly': False}

                data['github_email_id'], data['github_email_domain'] = split_email(
                    primary_email, False)
                data['personal_email_id'], data['personal_email_domain'] = split_email(
                    user_info['email'], False)

                return Response({"status": "success", "message": "회원가입 페이지로 이동합니다.", "data": data}, status=status.HTTP_200_OK)
        except Exception as e:
            logging.exception(f'Account Proccess Exception: {e}')
            return Response(get_fail_res("계정을 확인할 수 없습니다."))


def split_email(email, readonly=True):
    if email and '@' in email:
        email_id, email_domain = email.split('@')
        return {"value": email_id, "readonly": readonly}, {"value": email_domain, "readonly": readonly}
    elif not readonly:
        return {"value": "", "readonly": readonly}, {"value": "", "readonly": readonly}
    return None, None


class SignUpView(APIView):
    def check_duplicate_username(self, username):
        if Account.objects.filter(user__username=username).exists():
            return True
        return False

    def get(self, request):
        res = {'status': 'success', 'message': '', 'data': None}
        data = {'colleges': [], 'email_domains': [],
                'tags': [], 'consents': []}
        # 소속대학 리스트
        data['colleges'] = get_college_list()
        # 이메일 도메인
        data['email_domains'] = get_email_domains()
        # 사용언어 / 프레임워크
        tags = TagIndependent.objects.all()
        data['tags'] = TagIndependentSerializer(tags, many=True).data
        # 개인정보 이용내역 동의
        data['consents'] = get_consent_text('signin')
        res['data'] = data

        return Response(res)

    def post(self, request):
        fail_reason = {}
        # username 유효성 검사
        username = request.data.get('username', '').strip()
        if len(username) < 5:
            fail_reason['username'] = f'Username은 5자 이상이여야 합니다. 현재 {len(username)} 자'
        elif self.check_duplicate_username(username):
            fail_reason['username'] = '중복된 Username이 있습니다.'

        # password 유효성 검사
        password = request.data.get('password', '').strip()
        password_check = request.data.get('password_check', '').strip()
        if len(password) < 4:
            fail_reason['password'] = f'Password는 4자 이상이여야 합니다. 현재 {len(password)} 자'
        if password != password_check:
            fail_reason['password_check'] = 'Password가 일치하지 않습니다.'

        # 학번 유효성 검사
        student_id = request.data.get('student_id', 0)
        if not re.match('[0-9]{10}', str(student_id)):
            fail_reason['student_id'] = '학번 형식이 다릅니다.'
        if check_duplicate_student_id(request.data.get('student_id', 0)):
            fail_reason['student_id'] = '중복된 학번이 있습니다.'
        # 이름 유효성 검사
        name = request.data.get('name', '').strip()
        if len(name) > 20:
            fail_reason['name'] = f'이름은 20자를 넘을 수 없습니다. 현재 {len(name)} 자'
        # 소속대학 유효성 검사
        college = request.data.get('college', '')
        if not college:
            fail_reason['college'] = f'소속대학을 선택해주세요.'
        if not check_college(college):
            fail_reason['college'] = f'{college}는 소속대학 목록에 없는 이름입니다.'

        # 학과 유효성 검사
        dept = request.data.get('dept', '').strip()
        if len(dept) > 45:
            fail_reason['dept'] = f'학과명은 45자를 넘을 수 없습니다. 현재 {len(dept)} 자'

        # 이메일 유효성 검사
        personal_email = request.data.get('personal_email', '').strip()
        personal_email = personal_email + "@" + \
            request.data.get('personal_email_domain', '').strip()
        if len(personal_email) > 100:
            fail_reason['personal_email'] = f'이메일 주소는 100자를 넘을 수 없습니다. 현재 {len(personal_email)} 자'

        primary_email = request.data.get('primary_email', '').strip()
        primary_email = primary_email + "@" + \
            request.data.get('primary_email_domain', '').strip()
        if len(primary_email) > 100:
            fail_reason['primary_email'] = f'이메일 주소는 100자를 넘을 수 없습니다. 현재 {len(primary_email)} 자'

        # secondary email은 필수값이 아니므로 쓰지않았는지 확인
        secondary_email = request.data.get('secondary_email', '').strip()
        secondary_email = secondary_email + "@" + \
            request.data.get('secondary_email_domain', '').strip()
        secondary_email = None if secondary_email.strip() == "@" else secondary_email
        if not secondary_email:
            fail_reason['secondary_email'] = f'이메일이 형식에 맞지 않습니다.'
        elif len(secondary_email) > 100:
            fail_reason['secondary_email'] = f'이메일 주소는 100자를 넘을 수 없습니다. 현재 {len(secondary_email)} 자'

        try:
            if check_email(personal_email):
                fail_reason['personal_email'] = '이메일이 형식에 맞지 않습니다.'
            if check_email(primary_email):
                fail_reason['primary_email'] = '이메일이 형식에 맞지 않습니다.'
            if not secondary_email and check_email(secondary_email):
                fail_reason['secondary_email'] = '이메일이 형식에 맞지 않습니다.'
        except Exception as e:
            print("SignUpView exception", e)

        # 동의서 유효성 검사
        check_consent = request.data.get('consent', False)
        check_mandatory = request.data.get('consent_mandatory', False)

        if not check_consent:
            fail_reason['consent'] = '개인정보 이용내역을 확인하지 않았습니다.'
        elif not check_mandatory:
            fail_reason['consent'] = '개인정보 이용내역의 필수항목에 동의하지 않았습니다.'

        if len(fail_reason) > 0:
            return Response({'status': 'fail', 'message': f'{len(fail_reason.keys())} 개의 문제가 있습니다.', 'feedback': fail_reason})

        # 실패 케이스가 없으면 저장
        try:
            with transaction.atomic():
                user = User.objects.create_user(username=username,
                                                password=password,
                                                email=personal_email)
                user.save()
                github_id = request.data.get('github_id')
                student_data = StudentTab.objects.create(
                    id=student_id,
                    name=name,
                    college=college,
                    dept=dept,
                    github_id=github_id,
                    absence=request.data.get('absence'),
                    plural_major=request.data.get('plural_major'),
                    personal_email=personal_email,
                    primary_email=primary_email,
                    secondary_email=secondary_email
                )
                student_data.save()
                new_account = Account.objects.create(
                    user=user, student_data=student_data, github_id=github_id)
                new_account.save()
                account_interests = request.data.get('account_interests', [])
                for tag in account_interests:
                    tag = TagIndependent.objects.filter(name=tag)
                    if tag.exists():
                        AccountInterest.objects.create(
                            account=new_account, tag=tag.first(), level=0)

                open_lvl = request.data.get('open_lvl', 1)
                is_write = request.data.get('is_write', False)
                is_open = request.data.get('is_open', False)

                new_privacy = AccountPrivacy.objects.create(
                    account=new_account,
                    open_lvl=open_lvl,
                    is_write=is_write,
                    is_open=is_open
                )
                new_privacy.save()
        except DatabaseError as e:
            print('SignUpView 데이터베이스 오류.', e)
            return Response({'status': 'fail', 'message': '데이터베이스에 문제가 발생했습니다.'})

        return Response({'status': 'success'})


def github_login_callback(request):
    code = request.GET.get('code')
    if code is None:
        return redirect(reverse('common:login'))
    access_token = get_access_token(code)
    if access_token is None:
        context = {"alert": "GitHub에서 access_token을 얻지 못했습니다.",
                   "url": reverse('common:login')}
        return render(request, "community/redirect.html", context)
    primary_email = get_user_primary_email(access_token)
    print("primary_email", primary_email)
    user_info = get_user_info(access_token)
    print("user_info", user_info)

    if user_info is None:
        context = {"alert": "GitHub에서 유저 정보를 얻지 못했습니다.",
                   "url": reverse('common:login')}
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
            context = {'type': 'sign', 'username': user_info['username'],
                       'personal_email': user_info['email'], 'primary_email': primary_email}
            if context['personal_email']:
                context['personal_email_username'], context['personal_email_domain'] = context['personal_email'].split(
                    '@')
            if context['primary_email']:
                context['primary_email_username'], context['primary_email_domain'] = primary_email.split(
                    '@')
            context['msg'] = f'GitHub Login에 실패했습니다. 계정이 있는데 문제가 발생했다면 {EMAIL_HOST_USER} 로 문의해주시기 바랍니다.'
            return render(request, 'common/register.html', context)
    else:
        context = {'type': 'sign', 'username': user_info['username'],
                   'personal_email': user_info['email'], 'primary_email': primary_email}
        if context['personal_email']:
            context['personal_email_username'], context['personal_email_domain'] = context['personal_email'].split(
                '@')
        if context['primary_email']:
            context['primary_email_username'], context['primary_email_domain'] = primary_email.split(
                '@')
        context["msg"] = f'SOSD에 와주셔서 감사합니다!'
        return render(request, 'common/register.html', context)


class AccountFinderView(APIView):
    def post(self, request):
        try:
            print("AccountFinderView", request.get_host())
            email = request.data.get('email', None)
            user = User.objects.get(email=email)
            current_site = get_current_site(request=request)
            if current_site.name == 'example.com':
                current_site.name = "sosd.skku.edu"
            if current_site.domain == 'example.com':
                current_site.domain = "sosd.skku.edu"
            print("current_site", current_site.name,
                  " domain: ", current_site.domain)
            context = {'user': user, 'site_name': current_site.name,
                       'domain': current_site.domain}
            send_mail(subject_template_name="registration/subject_find_username.txt",
                      email_template_name="registration/email_find_username.txt",
                      context=context,
                      from_email=EMAIL_HOST_USER,
                      to_email=user.email)
            return Response({'status': 'success', 'message': '메일이 발송되었습니다.'})
        except User.DoesNotExist as de:
            logging.exception(f"valid_check DoesNotExist: {de}")
            return Response({'status': 'fail', 'message': '이메일을 찾을 수 없습니다. 이메일을 확인해주세요.'})
        except smtplib.SMTPServerDisconnected as disconn:
            logging.exception(f"valid_check SMTPServerDisconnected: {disconn}")
            return Response({'status': 'fail', 'message': '죄송합니다. 서비스에 문제가 있어 이메일을 발송할 수 없습니다.'})
        except Exception as e:
            logging.exception(
                f"valid_check error: {e}, {type(e).__name__}, {e.args}")
            return Response({'status': 'fail', 'message': '이메일 발송에 실패했습니다.'})


class PasswordResetSendView(APIView):
    def post(self, request):
        try:
            print("PasswordResetSendView", request.get_host())
            email = request.data.get('email', None)
            username = request.data.get('username', None)
            user = User.objects.get(username=username, email=email)

            self.save(
                user=user,
                subject_template_name="registration/password_reset_subject.txt",
                email_template_name="registration/password_reset_email.html",
                use_https=request.is_secure(),
                token_generator=default_token_generator,
                from_email=EMAIL_HOST_USER,
                request=request,
                html_email_template_name=None,
                extra_email_context=None
            )

            return Response({'status': 'success', 'message': '메일이 발송되었습니다.'})
        except User.DoesNotExist as de:
            logging.exception(f"valid_check DoesNotExist: {de}")
            return Response({'status': 'fail', 'message': '계정을 찾을 수 없습니다. 계정명과 이메일을 확인해주세요.'})
        except smtplib.SMTPServerDisconnected as disconn:
            logging.exception(f"valid_check SMTPServerDisconnected: {disconn}")
            return Response({'status': 'fail', 'message': '죄송합니다. 서비스에 문제가 있어 이메일을 발송할 수 없습니다.'})
        except Exception as e:
            logging.exception(
                f"valid_check error: {e}, {type(e).__name__}, {e.args}")
            return Response({'status': 'fail', 'message': '이메일 발송에 실패했습니다.'})

    def save(
        self,
        user,
        subject_template_name="registration/password_reset_subject.txt",
        email_template_name="registration/password_reset_email.html",
        use_https=False,
        token_generator=default_token_generator,
        from_email=None,
        request=None,
        html_email_template_name=None,
        extra_email_context=None,

    ):
        '''
        django.contrib.auth.forms.PasswordResetForm.save 메소드를 참고
        '''
        current_site = get_current_site(request)

        site_name = current_site.name
        domain = current_site.domain

        context = {
            "email": user.email,
            "domain": domain,
            "site_name": site_name,
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "user": user,
            "token": token_generator.make_token(user),
            "protocol": "https" if use_https else "http",
            **(extra_email_context or {}),
        }
        send_mail(
            subject_template_name,
            email_template_name,
            context,
            from_email,
            user.email
        )
        print("send_mail")


class PasswordResetView(auth_views.PasswordResetView):
    template_name = 'common/password_reset.html'
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
    template_name = 'common/password_reset_confirm.html'

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
    email_message = EmailMultiAlternatives(
        subject, body, from_email, [to_email])
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
                print("current_site", current_site.name,
                      " domain: ", current_site.domain)
                context = {'user': user, 'site_name': current_site.name,
                           'domain': current_site.domain}
                send_mail(subject_template_name="registration/subject_find_username.txt",
                          email_template_name="registration/email_find_username.txt",
                          context=context,
                          from_email=EMAIL_HOST_USER,
                          to_email=user.email)
                return JsonResponse({'status': 'success'})
            except User.DoesNotExist as de:
                print("valid_check DoesNotExist: ", de)
                return JsonResponse({'status': 'fail', 'message': '이메일을 찾을 수 없습니다. 이메일을 확인해주세요.'})
            except smtplib.SMTPServerDisconnected as disconn:
                print("valid_check SMTPServerDisconnected: ", disconn)
                return JsonResponse({'status': 'fail', 'message': '죄송합니다. 서비스에 문제가 있어 이메일을 발송할 수 없습니다.'})
            except Exception as e:
                print("valid_check error: ", e, type(e).__name__, e.args)
                return JsonResponse({'status': 'fail', 'message': '이메일 발송에 실패했습니다.'})
    return JsonResponse({'status': 'fail', 'message': '이메일을 찾을 수 없습니다.'})


def register_page(request):
    if request.method == 'GET':
        REDIRECT_URL = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}" if GITHUB_CLIENT_ID else reverse(
            'common:login')
        return redirect(REDIRECT_URL)
    if request.method == 'POST':
        fail_reason = []
        if len(request.POST.get('username')) < 5:
            fail_reason.append('Username은 5자 이상이여야 합니다.')
        if request.POST['password-check'] != request.POST['password']:
            fail_reason.append('password가 일치하지 않습니다.')
        if not re.match('[0-9]{10}', request.POST['student-id']):
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
        # 필수 항목 동의는 hard하게 확인
        if not request.POST['radio-3'] == "1":
            fail_reason.append('개인정보 이용내역의 필수항목에 동의하지 않았습니다.')

        personal_email = request.POST['personal-email'] + \
            "@" + request.POST['personal-email-domain']
        primary_email = request.POST['primary-email'] + \
            "@" + request.POST['primary-email-domain']
        secondary_email = request.POST['secondary-email'] + \
            "@" + request.POST['secondary-email-domain']
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
                                                password=request.POST.get(
                                                    'password'),
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
                new_account = Account.objects.create(
                    user=user, student_data=student_data, github_id=request.POST['github-id'])
                new_account.save()
                tag_list = request.POST.get('category_tag_list', '').split(',')
                for tag in tag_list:
                    tag = TagIndependent.objects.filter(name=tag)
                    if len(tag) == 1:
                        AccountInterest.objects.create(
                            account=new_account, tag=tag[0])

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
    # 회원가입 페이지에서 Username Check 버튼 누를 때 유효성 확인

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


def check_github_id(request):
    # 회원가입 페이지에서 GitHub Username Check 버튼 누를 때 유효성 확인

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


def check_student_id(request):
    # 회원가입 페이지에서 학번 Check 버튼 누를 때 학번 유효성 확인

    if request.method == 'POST':
        fail_reason = []
        student_id = request.POST['student-id']

        if not re.match('[0-9]{10}', student_id):
            fail_reason.append('학번 형식이 다릅니다.')
        if check_duplicate_student_id(student_id):
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


def csrf_failure(request, reason=""):
    return redirect(reverse('common:login'))


def get_access_token(code):
    try:
        github_data = {"code": code}
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
            print("res.json()", res.json())
            access_token = res.json()['access_token']
            refresh_token = res.json()['refresh_token']
            return access_token
        else:
            print("status error", res.status_code)
            return None
    except Exception as e:
        logging.exception(f"get_access_token error: {e}")
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
    # FIXME primary email 값 가져오지 못함
    headers = {'Accept': 'application/vnd.github+json',
               'Authorization': f'Bearer {access_token}',
               'X-GitHub-Api-Version': '2022-11-28'}
    res = requests.get('https://api.github.com/user/emails', headers=headers)
    primary_email = None

    if res.status_code == 200:
        emails = res.json()

        for email in emails:
            if email['primary']:
                primary_email = email['email']
                break
    else:
        print("status error", res.status_code, res.reason, res.content)

    return primary_email


class EmailDomainListView(APIView):
    def get(self, request):
        domain_list = ["g.skku.edu", "skku.edu", "gmail.com",
                       "naver.com", "kakao.com", "nate.com", "yahoo.com"]
        res = {'status': 'success', 'data': domain_list}

        return Response(res)
