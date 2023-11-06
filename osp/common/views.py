import logging
import re
import smtplib

import requests
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError, transaction
from django.template import loader
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from common.utils import (check_college, check_email, get_college_list,
                          get_consent_text, get_email_domains, get_fail_res)
from crawler.Scrapy.SKKU_GitHub.settings import OAUTH_TOKEN_FOR_REG
from osp.settings import (EMAIL_HOST_USER, GITHUB_CLIENT_ID,
                          GITHUB_CLIENT_SECRET)
from tag.models import TagIndependent
from tag.serializers import TagIndependentSerializer
from user.models import Account, AccountInterest, AccountPrivacy, StudentTab

from data.api import GitHub_API


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
            return Response({"status": "success", "message": "로그인 성공", "data": data})

        return Response(get_fail_res("인증에 실패했습니다. Username과 password를 다시 확인해주세요."),)


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
        elif check_duplicate_username(username):
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
        if secondary_email.strip() == "@" or secondary_email.strip() == "":
            secondary_email = None
        try:
            if check_email(personal_email):
                fail_reason['personal_email'] = '이메일이 형식에 맞지 않습니다.'
            if check_email(primary_email):
                fail_reason['primary_email'] = '이메일이 형식에 맞지 않습니다.'
            if not secondary_email and check_email(secondary_email):
                fail_reason['secondary_email'] = '이메일이 형식에 맞지 않습니다.'
        except Exception as e:
            logging.exception(f"SignUpView exception {e}")

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


class CheckUserView(APIView):
    def post(self, request):
        # 회원가입 페이지에서 Username Check 버튼 누를 때 유효성 확인
        fail_reason = None
        username = request.data.get('username')
        print('username', username)
        if len(username) < 5:
            fail_reason = 'Username은 5자 이상이여야 합니다.'
        elif check_duplicate_username(username):
            fail_reason = '중복된 Username이 있습니다.'
        if fail_reason:
            return Response({'status': 'fail', 'message': fail_reason})
        return Response({'status': 'success', 'message': '사용가능한 Username입니다.'})


class CheckGithubIdView(APIView):
    def post(self, request):
        fail_reason = None
        github_id = request.data.get('github_id')
        if len(github_id) == 0:
            fail_reason = 'GitHub Username을 입력해주세요.'
        elif check_duplicate_github_id(github_id):
            fail_reason = '중복된 아이디가 있습니다.'
        elif not check_api_github(github_id):
            fail_reason = 'GitHub Username을 확인할 수 없습니다.'
        if fail_reason:
            return Response({'status': 'fail', 'message': fail_reason})
        return Response({'status': 'success', 'message': '사용가능한 GitHub Username입니다.'})


class CheckStudentIdView(APIView):
    def post(self, request):
        fail_reason = None
        student_id = request.data['student_id']
        if not student_id:
            fail_reason = '학번을 입력해주세요.'
        elif not re.match('[0-9]{10}', student_id):
            fail_reason = '학번 형식이 다릅니다.'
        elif check_duplicate_student_id(student_id):
            fail_reason = '중복된 학번이 있습니다.'
        if fail_reason:
            return Response({'status': 'fail', 'message': fail_reason})
        return Response({'status': 'success', 'message': '사용가능한 학번입니다.'})


def check_duplicate_username(username):
    if Account.objects.filter(user__username=username).exists():
        return True
    return False


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


class PasswordResetConfirmView(APIView):
    # 비밀번호 재설정

    def get(self, request, uidb64, token):
        if not uidb64 or not token:
            return Response({'stauts': 'fail', 'message': '링크가 올바르지 않습니다'})
        user = self.get_user(uidb64)
        token_valid = default_token_generator.check_token(user, token)

        if token_valid:
            return Response({'status': 'success'})
        return Response({'stauts': 'fail', 'message': '유효하지 않은 링크입니다. 이미 사용했거나 만료되었습니다. 비밀번호 재설정을 다시 진행해주세요.'})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        context.update({"type": 'sign'})
        return context

    def post(self, request, uidb64, token):
        if not uidb64 or not token:
            return Response({'stauts': 'fail', 'message': '링크가 올바르지 않습니다'})

        user = self.get_user(uidb64)
        token_valid = default_token_generator.check_token(user, token)
        if token_valid:
            try:
                password = request.data.get('password')
                user.set_password(password)
                user.save()
                return Response({'status': 'success', 'message': f'비밀번호를 변경했습니다.'})

            except Exception as e:
                logging.exception(f'{e}')
                return Response({'status': 'fail', 'message': f'비밀번호를 변경하는데 실패했습니다. {e}'})

        return Response({'status': 'fail', 'message': '유효하지 않은 링크입니다. 이미 사용했거나 만료되었습니다. 비밀번호 재설정을 다시 진행해주세요.'})

    def get_user(self, uidb64):
        '''
        uid를 이용해 User 객체를 받아오는 메소드
        '''
        uid = urlsafe_base64_decode(uidb64).decode()
        UserModel = get_user_model()
        user = UserModel._default_manager.get(pk=uid)

        return user


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
