from django.db import transaction, DatabaseError
from django.shortcuts import render, resolve_url
from django.urls import reverse
from django.http import JsonResponse
from django.core.files.images import get_image_dimensions
from django.template.loader import render_to_string
from .models import Team, TeamMember, TeamTag, TeamInviteMessage
from tag.models import Tag
from user.models import Account, User
from community.models import Board, Article, TeamRecruitArticle
from message.models import Message

from rest_framework.response import Response
from rest_framework.views import APIView


from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser

from community.serializers import BoardSerializer, ArticleSerializer
from user.serializers import AccountSerializer, AccountPrivacySerializer
from team.serializers import TeamSerializer, TeamMemberSerializer, TemaTagSerializer
from tag.serializers import TagIndependentSerializer


from datetime import datetime

from .utils import *


class TeamInviteOnTeamboardView(APIView):
    '''
    팀 게시판에서의 팀원 초대 창
    url : /team/api/team-invite-on-teamboard

    GET  : 팀원 초대 창

        Request  :
            team_id : 현재 팀게시판의 팀 ID

        Response :
        {
            "status" : <success/fail> ,
            # SUCCESS
            "data" : 
            {
                # 기존 팀멤버 를 제외한 유저들의 id, username list
                "usernames_exclude_members" : 
                [
                    {
                        "id" : <유저ID 1>,
                        "username" : <유저이름 1>
                    },
                    {
                        "id" : <유저ID 2>,
                        "username" : <유저이름 2>
                    },
                    ...
                ]
            }
            # FAIL
            "errors" :
            {
                "<에러키 1>" : "<에러메세지 1>",
                "<에러키 2>" : "<에러메세지 2>",
                ...
            }
        }

        ERRORS
            require_login : 로그인이 필요함
            user_current_is_not_teammember : 현재 접속한 멤버가 해당 팀의 멤버가 아님
            DB_exception : DB 에러
            undefined_exception :  정의되지 않은 exception 


    POST : 팀원 초대

        Request  :
            target_user_id : 초대 대상 유저 ID
            target_team_id : 초대 팀 ID
            invite_msg : 초대 메세지

        Response :
        {
            "status" : <success/fail>
            # SUCCESS
            "data" :
            {

            }
            # FAIL
            "errors" :
            {
                "<에러키 1>" : "<에러메세지 1>",
                "<에러키 2>" : "<에러메세지 2>",
                ...
            }
        }
        ERRORS
            require_login : 로그인이 필요함
            user_current_is_not_teammember : 현재 접속한 멤버가 해당 팀의 멤버가 아님
            user_not_found : 초대 대상 유저가 존재하지 않음
            team_not_found : 초대 팀이 존재하지 않음

            already_member : 초대 대상 유저가 이미 팀 멤버임
            message_too_long   : 초대 메세지가 150자 이상임.

            db_exception : DB 에러
            undefined_exception :  정의되지 않은 exception 


    '''

    def get_validation(self, request, status, errors):
        team_id = request.GET.get('team_id')
        user = request.user

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        elif (len(TeamMember.objects.filter(team__id=team_id, member=user.id).values_list('id')) == 0):
            errors['is_not_teammember'] = '해당 팀의 멤버가 아닙니다.'
            status = 'fail'

        return status, errors

    def get(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors \
            = self.get_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        team_id = request.GET.get('team_id')
        try:
            teammembers = TeamMember.objects.filter(
                team__id=team_id).values_list('id')

            usernames_exclude_members = User.objects.exclude(
                id__in=teammembers).exclude(is_staff=True).values('id', 'username')

            data['usernames_exclude_members'] = usernames_exclude_members
        except DatabaseError as e:
            # Database Exception handling
            status = 'fail'
            errors['DB_exception'] = 'DB Error'
        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}
        return Response(res)

    def post_validation(self, request, status, errors):

        target_user_id = request.data.get('target_user_id', False)
        target_team_id = request.data.get('target_team_id', False)
        invite_msg = request.data.get('invite_msg', False)
        user = request.user

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        try:
            target_team = Team.objects.get(id=target_team_id)
        except Team.DoesNotExist:
            errors['team_not_found'] = '초대할 팀이 존재하지 않습니다.'
            status = 'fail'

        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            errors['team_not_found'] = '초대할 대상이 존재하지 않습니다.'
            status = 'fail'

        if not is_teammember(target_team_id, request.user.id):
            errors['is_not_teammember'] = '현재 접속한 유저가 해당 팀의 멤버가 아닙니다.'
            status = 'fail'

        if is_teammember(target_team_id, target_user_id):
            errors['already_member'] = '초대 대상이 이미 팀의 멤버입니다.'
            status = 'fail'

        if len(invite_msg) > 150:
            errors['msg_too_long'] = f'초대 메세지는 150자 이하여야입니다. 현재 {len(invite_msg)}자'
            status = 'fail'

        return target_team, target_user, status, errors

    def post(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        target_team, target_user, status, errors \
            = self.post_validation(request, status, errors, *args, **kwargs)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        target_user_id = request.data.get('target_user_id', False)
        target_team_id = request.data.get('target_team_id', False)
        invite_msg = request.data.get('invite_msg', False)

        try:
            with transaction.atomic():
                team = Team.objects.get(id=target_team_id)
                target_account = Account.objects.get(
                    user__id=target_user.id)

                # 팀원 초대 메세지 객체 생성
                TeamInviteMessage.objects.create(
                    team=target_team,
                    account=target_account,
                    message=invite_msg,
                    direction=True,
                    send_date=datetime.now(),
                )

                # noti - 자동생성 (signals)
                # msg

                # board     : 초대대상 팀 Board 객체 ( team Team 객체로 쿼리 )
                # url       : 메세지 url ( board.name, board.id로 생성 )
                # sender    : 발송자 Account 객체 ( request.user 로 쿼리 )

                board = Board.objects.get(team=team)
                url = resolve_url('community:Board',
                                  board_name=board.name, board_id=board.id)
                sender = Account.objects.get(user=request.user.id)

                # 메세지 객체 생성
                Message.objects.create(
                    sender=sender,
                    receiver=target_account,
                    body=f"[{team.name}] 초대장이 있습니다.<br><a href='{url}'>링크</a>를 확인해주세요.<br> 초대 메세지:"+invite_msg,
                    send_date=datetime.now(),
                    receiver_read=False,
                    sender_delete=False,
                    receiver_delete=False
                )

                # 요청 성공, status : sccess 리턴
                status = 'success'

        except DatabaseError as e:
            # Database Exception handling
            status = 'fail'
            errors['DB_exception'] = 'DB Error'
        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)


class TeamInviteOnRecommendView(APIView):
    '''
    맞춤유저 추천에서의 팀원 초대 창
    url : /team/api/team-invite-on-recommend

    GET  : 팀원 초대 창

        Request  :

        Response :
        {
            "status" : <success/fail> ,
            # SUCCESS
            "data" : 
            {
                # 현재 접속한 유저의 소속팀 ID, 이름 리스트
                "teams_of_user" : 
                [
                    {
                        "id" : <팀ID1>,
                        "name" : <팀이름1>
                    },
                    {
                        "id" : <팀ID2>, 
                        "name" : <팀이름2>
                    },
                    ...
                ]
            }
            # FAIL
            "msg" : <상태메세지> 
        }
        ERRORS
            require_login : 로그인이 필요함
            is_not_teammember : 현재 접속한 멤버가 해당 팀의 멤버가 아님
            undefined_exception :  정의되지 않은 exception 

    POST : 팀원 초대

        Request  :
            target_user_id : 초대 대상 유저 ID
            target_team_id : 초대 팀 ID
            invite_msg : 초대 메세지

        Response :
        {
            "status" : <success/fail> ,
            "msg" : <상태메세지>
        }
        ERRORS
            require_login : 로그인이 필요함
            is_not_teammember : 현재 접속한 멤버가 해당 팀의 멤버가 아님
            user_not_found : 초대 대상 유저가 존재하지 않음
            team_not_found : 초대 팀이 존재하지 않음
            already_member : 초대 대상 유저가 이미 팀 멤버임
            msg_too_long   : 초대 메세지가 150자 이상임.
            DB : db 에러
            undefined_exception :  정의되지 않은 exception 
    '''

    def get_validation(self, request, status, errors):
        team_id = request.GET.get('team_id')
        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        elif (len(TeamMember.objects.filter(team__id=team_id, member=user.id).values_list('id')) == 0):
            errors['is_not_teammember'] = '해당 팀의 멤버가 아닙니다.'
            status = 'fail'

        return status, errors

    def get(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Requset Validation
        status, errors \
            = self.get_validation(request, errors, status)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        user = request.user
        try:

            team_id_include_user = TeamMember.objects.filter(
                member=user.id).values_list('team_id')
            teams_of_user = Team.objects.filter(
                id__in=team_id_include_user).values('id', 'name')

            data['teams_of_user'] = teams_of_user

        except DatabaseError as e:
            # Database Exception handling
            status = 'fail'
            errors['DB_exception'] = 'DB Error'
        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}
        return Response(res)

    def post_validation(self, request, status, errors):

        target_user_id = request.data.get('target_user_id', False)
        target_team_id = request.data.get('target_team_id', False)
        invite_msg = request.data.get('invite_msg', False)
        user = request.user

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            try:
                target_team = Team.objects.get(id=target_team_id)
            except Team.DoesNotExist:
                errors['team_not_found'] = '초대할 팀이 존재하지 않습니다.'
                status = 'fail'

            try:
                target_user = User.objects.get(id=target_user_id)
            except User.DoesNotExist:
                errors['team_not_found'] = '초대할 대상이 존재하지 않습니다.'
                status = 'fail'

            if not is_teammember(target_team_id, request.user.id):
                errors['is_not_teammember'] = '현재 접속한 유저가 해당 팀의 멤버가 아닙니다.'
                status = 'fail'

            if is_teammember(target_team_id, target_user_id):
                errors['already_member'] = '초대 대상이 이미 팀의 멤버입니다.'
                status = 'fail'

            if len(invite_msg) > 150:
                errors['msg_too_long'] = f'초대 메세지는 150자 이하여야입니다. 현재 {len(invite_msg)}자'
                status = 'fail'

        return target_team, target_user, status, errors

    def post(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors \
            = self.post_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        target_user_id = request.data.get('target_user_id', False)
        target_team_id = request.data.get('target_team_id', False)
        invite_msg = request.data.get('invite_msg', False)
        try:
            with transaction.atomic():

                # team      : 초대 팀의 Team 객체 ( target_team_name 로 쿼리 )
                # account   : 초대 대상의 Account 객체 ( target_user_username 으로 쿼리 )

                team = Team.objects.get(name=target_team_id)
                account = Account.objects.get(
                    user__username=target_user_id)

                # 팀원 초대 메세지 객체 생성
                TeamInviteMessage.objects.create(
                    team=team,
                    account=account,
                    message=invite_msg,
                    direction=True,
                    send_date=datetime.now(),
                )

                # noti - 자동생성 (signals)
                # msg

                # board     : 초대대상 팀 Board 객체 ( team Team 객체로 쿼리 )
                # url       : 메세지 url ( board.name, board.id로 생성 )
                # sender    : 발송자 Account 객체 ( request.user 로 쿼리 )

                board = Board.objects.get(team=team)
                url = resolve_url('community:Board',
                                  board_name=board.name, board_id=board.id)
                sender = Account.objects.get(user=request.user.id)

                # 메세지 객체 생성
                Message.objects.create(
                    sender=sender,
                    receiver=account,
                    body=f"[{team.name}] 초대장이 있습니다.<br><a href='{url}'>링크</a>를 확인해주세요.<br> 초대 메세지:"+invite_msg,
                    send_date=datetime.now(),
                    receiver_read=False,
                    sender_delete=False,
                    receiver_delete=False
                )

                # 요청 성공, status : sccess 리턴
                res = {'status': 'success'}
                return Response(res)

        except DatabaseError as e:
            # Database Exception handling
            status = 'fail'
            errors['DB_exception'] = 'DB Error'
        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)


class TeamCreateView(APIView):
    '''

    url : /team/api/team-create

    GET  : 팀 생성창

        Request  :

        Response :
        {
            "status" : <success/fail>
            # SUCCESS
            "data" :
            {

            }
            # FAIL
            "errors" :
            {
                "<에러키 1>" : "<에러메세지 1>",
                "<에러키 2>" : "<에러메세지 2>",
                ...
            }
        }

        ERRORS:
            require_login : 로그인이 안되었을 경우
            DB : db 에러 


    POST : 팀 생성

        Request  :
        team_name : <생성 팀 이름>
        team_description : <생성 팀 설명>
        team_image : 팀 이미지

        Response :
        {
            "status" : <success/fail>
            # SUCCESS
            "data" : 
            {

            }
            # FAIL
            "msg" : <상태메세지>
            "errors" : <에러리스트>

        }
        ERRORS:
            require_login : 로그인이 안되었을 경우
            team_name_empty : team_name이 공란일 경우
            team_name_duplicate : team_name이 중복일 경우
            team_decription_empty : desription이 공란일 경우
            image_too_big : 팀이미지가 너무 클 경우
            DB : db 에러
    '''

    def get_validation(self, request, status, errors):

        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        return status, errors

    def get(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = \
            self.get_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)

    def post_validation(request, status, errors):

        team_name = request.data.get('team_name', False)
        team_name = team_name.strip() if isinstance(team_name, str) else team_name
        team_description = request.data.get('team_description', False)
        team_description = ' '.join(team_description.split())
        team_image = request.FILES.get('team_image', False)

        if not request.user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        # Team Name Check
        if not team_name:
            errors['team_name_empty'] = '이름은 필수 입력값입니다.'
            status = 'fail'

        else:
            team_obj = Team.objects.filter(name=team_name)
            if len(team_obj) > 0:
                errors['team_name_duplicate'] = '팀 이름이 이미 존재합니다.'
                status = 'fail'

        if not team_description:
            errors['team_description_duplicate'] = '설명은 필수 입력값입니다.'
            status = 'fail'
        else:
            if len(team_description) < 30 or len(team_description) > 150:
                errors[
                    'team_description_length'] = f'팀 설명은 30자 이상 150자 이하입니다. 현재 {len(team_description)}자'
                status = 'fail'

        if team_image:
            img_width, img_height = get_image_dimensions(team_image)
            if img_width > 500 or img_height > 500:
                is_valid = False
                # \u00d7 는 곱셈기호
                errors['team_image_too_big'] = f'이미지 크기는 500px \u00d7 500px 이하입니다. 현재 {img_width}px \u00d7 {img_height}px'

        return status, errors

    def post(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = \
            self.post_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        team_name = request.data.get('team_name', False)
        team_name = team_name.strip() if isinstance(team_name, str) else team_name
        team_description = request.data.get('team_description', False)
        team_description = ' '.join(team_description.split())
        team_image = request.FILES.get('team_image', False)

        try:
            with transaction.atomic():
                if team_image:
                    # team_img를 입력 받았을 시
                    # image 가 포함된 Team 객체 생성
                    new_team = Team.objects.create(
                        name=team_name,
                        description=team_description,
                        image=team_image,
                        create_date=datetime.now()
                    )
                else:
                    # team_img를 입력 받지 않을시
                    # imager가 포함되지 않은 Team 객체 생성 ( dedault = img/team/default.jpg )
                    new_team = Team.objects.create(
                        name=team_name,
                        description=team_description,
                        create_date=datetime.now()
                    )

                # 생성한 team 객체 DB 저장
                new_team.save()

                # 팀 생성한 유저 Account 객체 ( request.user 로 쿼리 )
                account = Account.objects.get(user=request.user.id)

                # TeamMember 객체 생성, admin으로 설정
                team_member = TeamMember.objects.create(
                    team=new_team,
                    member=account,
                    is_admin=True,
                )

                # 생성한 TeamMember 객체 저장
                team_member.save()

                # 생성한 team의 Board 생성
                Board.objects.create(
                    name=team_name,
                    board_type='Team',
                    anonymous_writer=False,
                    team=new_team,
                )

                # 요청 성공 / status : success 리턴

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'

        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)


class TeamUpdateView(APIView):
    '''
    url  : /team/api/team-update

    GET  : 팀 업데이트창

        Request  :
            target_team_id : 업데이트할 팀의 ID

        Response :
        {
            "status" : <success/fail>,
            # SUCCESS
            "data" :
            {

                "team" : <팀 객체>,
                "team_members" : <팀 멤버 객체 리스트>,
                "team_tag_list": <팀 태그 객체 리스트>
            }
            # FAIL
            "errors" :
            {
                "<에러키 1>" : "<에러메세지 1>",
                "<에러키 2>" : "<에러메세지 2>",
                ...
            }
        }
        ERRORS:
            require_login : 로그인이 안되었을 경우
            team_name_empty : team_name이 공란일 경우
            team_name_duplicate : team_name이 중복일 경우
            team_decription_empty : desription이 공란일 경우
            image_too_big : 팀이미지가 너무 클 경우
            DB : db 에러

        POST : 팀 업데이트

        Request  :
            target_team_id : 변경대상 팀 ID
            team_name : 변경할 팀 이름
            team_description : 생성 팀 설명
            team_image : 팀 이미지
            team_admin_list : 팀 어드민 리스트(id)
            team_tag_list : 태그 리스트

        Response :
        {
            "status" : <success/fail>,
            "msg" : <상태메세지>
            # FAIL
            "errors" : <에러리스트>
        }
        ERRORS:

    '''

    def get_validation(self, request, status, errors):

        user = request.user
        account = Account.objects.get(user=user)
        target_team_id = request.GET.get('target_team_id')

        if not request.user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            # team = Team.objects.get(id=target_team_id)
            if status == 'success':
                try:
                    team = Team.objects.get(id=target_team_id)

                except Team.DoesNotExist:
                    errors['team_not_found'] = "해당 팀이 존재하지 않습니다."
                    status = 'fail'

            if status == 'success':
                try:
                    TeamMember.objects.get(team=team, member=account)
                except TeamMember.DoesNotExist:
                    errors['user_is_not_teammember'] = '해당 팀의 멤버가 아닙니다.'
                    status = 'fail'

            if status == 'success':
                try:
                    TeamMember.objects.get(
                        team=team, member=account, is_admin=1)
                except TeamMember.DoesNotExist:
                    errors['user_is_not_teamadmin'] = '해당 팀의 관리자가 아닙니다.'
                    status = 'fail'

        return status, errors

    def get(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = \
            self.get_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        try:
            target_team_id = request.GET.get('target_team_id')
            team = Team.objects.get(id=target_team_id)
            team_members = TeamMember.objects.filter(
                team=team)
            print(team_members)
            team_tag_list = TeamTag.objects.filter(team=team)

            data['team'] = TeamSerializer(team).data
            data['team_members'] = TeamMemberSerializer(
                team_members, many=True).data
            data['team_tag_list'] = TemaTagSerializer(
                team_tag_list, many=True).data

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'

        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)

    def post_validation(self, request, status, errors):

        target_team_id = request.data.get('target_team_id', False)

        team_name = request.data.get('team_name', False)
        team_name = team_name.strip() if isinstance(team_name, str) else team_name

        team_description = request.data.get('team_description', False)
        team_description = ' '.join(team_description.split())

        team_image = request.FILES.get('team_image', False)

        if not request.user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        # Team Name Check
        if not team_name:
            errors['team_name_empty'] = '이름은 필수 입력값입니다.'
            status = 'fail'

        else:
            team_obj = Team.objects.filter(name=team_name)
            if len(team_obj) > 0:
                errors['team_name_duplicate'] = '팀 이름이 이미 존재합니다.'
                status = 'fail'

        if not team_description:
            errors['team_description_duplicate'] = '설명은 필수 입력값입니다.'
            status = 'fail'
        else:
            if len(team_description) < 30 or len(team_description) > 150:
                errors[
                    'team_description_length'] = f'팀 설명은 30자 이상 150자 이하입니다. 현재 {len(team_description)}자'
                status = 'fail'

        if team_image:
            img_width, img_height = get_image_dimensions(team_image)
            if img_width > 500 or img_height > 500:
                is_valid = False
                # \u00d7 는 곱셈기호
                errors['team_image_too_big'] = f'이미지 크기는 500px \u00d7 500px 이하입니다. 현재 {img_width}px \u00d7 {img_height}px'

        return status, errors

    def post(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = \
            self.post_validation(request, status, errors)

        target_team_id = request.data.get('target_team_id')
        team = Team.objects.get(id=target_team_id)

        # Transactions
        team_name = request.data.get('team_name', False)
        team_name = team_name.strip() if isinstance(team_name, str) else team_name
        team_description = request.data.get('team_description', False)
        team_description = ' '.join(team_description.split())
        team_image = request.FILES.get('team_image', False)

        try:
            with transaction.atomic():
                # team update 후 저장
                team.name = team_name
                team.description = team_description
                if team_image:
                    team.image = team_image
                team.save()

                # 팀 게시판 이름 수정
                team_board = Board.objects.get(team_id=team.id)
                team_board.name = team_name
                team_board.save()
                # teamMember create and update
                admin_list = request.data.get('admin_list').split(',')
                for x in admin_list:
                    if not x:
                        admin_list = []
                        break
                member_list = request.data.get('member_list').split(',')
                for x in member_list:
                    if not x:
                        member_list = []
                        break
                member_list_old = list(TeamMember.objects.filter(
                    team=team).values_list('member__user__username', flat=True))

                for member_name in list(set(member_list_old) - set(member_list)):
                    account = Account.objects.get(
                        user__username=member_name)
                    TeamMember.objects.get(
                        member=account, team=team).delete()

                for member_name in member_list:
                    teammember = TeamMember.objects.get(
                        team=team, member__user__username=member_name)
                    teammember.is_admin = member_name in admin_list
                    teammember.save()

                # teamTag create and delete
                tag_list = request.data.get('category_tag_list').split(',')
                tag_list_old = list(TeamTag.objects.filter(
                    team=team).values_list('tag__name', flat=True))

                for tag in tag_list:
                    if not tag:
                        tag_list = []
                        break
                for tag_name in list(set(tag_list_old) - set(tag_list)):
                    TeamTag.objects.get(
                        team=team, tag__name=tag_name).delete()
                for tag_name in list(set(tag_list) - set(tag_list_old)):
                    tag = Tag.objects.get(name=tag_name)
                    TeamTag.objects.create(team=team, tag=tag)

                if len(TeamMember.objects.filter(team=team, is_admin=True)) == 0:
                    raise Exception('팀 관리자는 0명이 될 수 없습니다.')
                team.save()

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'

        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'
        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)


class TeamApplyView(APIView):
    '''
    url  : /team/api/team-apply

    GET  : 팀 가입신청창

        Request  :
            target_article_id : <지원한 팀모집 게시글 ID>

        Response :
        {
            "data" :
            {
                "status" : <success/fail>,
                # SUCCESS
                "team" : <팀 객체>,
            }
            # FAIL
            "errors" :
            {
                "<에러키 1>" : "<에러메세지 1>",
                "<에러키 2>" : "<에러메세지 2>",
                ...
            }
        }
        ERRORS:
            require_login : 로그인이 안되었을 경우
            team_name_empty : team_name이 공란일 경우
            team_name_duplicate : team_name이 중복일 경우
            team_decription_empty : desription이 공란일 경우
            image_too_big : 팀이미지가 너무 클 경우
            DB : db 에러

    POST : 팀 가입신청

        Request  :
            tteam_id : 요청 팀 ID
            message : 요청 메시지

        Response :
        {
            "status" : <success/fail>
            # FAIL
            "msg" : <상태메세지>,
            "errors" : <에러리스트>
        }
    '''

    def get_validation(self, request, status, errors):
        user = request.user
        target_article_id = request.GET.get('target_article_id')

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            if status == 'success':
                try:
                    team_recruit_article = TeamRecruitArticle.objects.get(
                        id=target_article_id)
                except TeamRecruitArticle.DoesNotExist:
                    errors['article_not_found'] = "해당 게시글이 존재하지 않습니다."
                    status = 'fail'

            if status == 'success':
                try:
                    team = team_recruit_article.team
                except Team.DoesNotExist:
                    errors['team_not_found'] = '더이상 존재하지 않는 팀 입니다.'
                    status = 'fail'

            if status == 'success':
                if TeamRecruitArticle.period_end < datetime.datetime.now():
                    errors['article_recruit_expired'] = '만료된 팀의 모집기간입니다. '
                    status = 'fail'

        return status, errors

    def get(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = \
            self.get_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        target_article_id = request.GET.get('target_article_id')
        try:
            team_recruit_article = TeamRecruitArticle.objects.get(
                id=target_article_id)
            team = team_recruit_article.team

            data['team'] = TeamSerializer(team).data

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'
        except:
            errors['undefined_exception'] = 'undefined_exception'
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)

    def post_validation(self, request, status, errors):
        user = request.user
        target_article_id = request.data.get('target_article_id')

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            if status == 'success':
                try:
                    team_recruit_article = TeamRecruitArticle.objects.get(
                        id=target_article_id)
                except TeamRecruitArticle.DoesNotExist:
                    errors['article_not_found'] = "해당 게시글이 존재하지 않습니다."
                    status = 'fail'

            if status == 'success':
                try:
                    team = team_recruit_article.team
                except Team.DoesNotExist:
                    errors['team_not_found'] = '더이상 존재하지 않는 팀 입니다.'
                    status = 'fail'

            if status == 'success':
                if TeamRecruitArticle.period_end < datetime.datetime.now():
                    errors['article_recruit_expired'] = '만료된 팀의 모집기간입니다. '
                    status = 'fail'

            if status == 'success':
                if is_teammember(team.id, user.id):
                    errors['user_already_teammember'] = '이미 해당 팀의 멤버입니다.'
                    status = 'fail'

    def post(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = \
            self.post_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions

        account = Account.objects.get(user=request.user.id)
        target_article_id = request.data.get('target_article_id')
        team_recruit_article = TeamRecruitArticle.objects.get(
            id=target_article_id)
        team = team_recruit_article.team
        try:
            with transaction.atomic():
                message = request.data.get('message')
                TeamInviteMessage.objects.create(
                    team=team,
                    account=account,
                    message=message,
                    status=0,  # 대기 중
                    direction=False,  # FROM ACCOUNT TO_TEAM
                    send_date=datetime.now(),
                )

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'
        except:
            errors['undefined_exception'] = 'undefined_exception'
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)


class TeamOutView(APIView):
    '''
    url  : /team/api/team-out

    POST : 팀 탈퇴신청

        Request  :
            target_team_id : <요청 팀 ID>

        Response :
        {
            "status" : <success/fail>
            # FAIL
            "msg" : <상태메세지>,
            "errors" : <에러리스트>
        }
    '''
    def post_validation(request, status, errors):
        user = request.user
        account = Account.objects.get(user=user)
        target_team_id = request.data.get('target_team_id')

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            if status == 'success':
                try:
                    team = Team.objects.get(id=target_team_id)
                except Team.DoesNotExist:
                    errors['team_not_found'] = '존재하지 않는 팀 입니다.'
                    status = 'fail'

            if status == 'success':
                try:
                    teammember = TeamMember.objects.get(
                        team=team, member=account)
                    teammembers = TeamMember.objects.filter(team=team)

                    if teammembers.count() > 1 and teammember.is_admin:
                        errors['teammember_less'] = '멤버가 여러명일 경우 admin은 탈퇴가 불가능합니다.\nadmin을 해제해주세요.'

                except TeamMember.DoesNotExist:
                    errors['teammember_not_found'] = '팀멤버가 존재하지 않습니다. '
                    status = 'fail'

        return status, errors

    def post(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = \
            self.post_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions

        try:
            team_id = request.data.get('team_id')
            team = Team.objects.get(id=team_id)
            user = request.user
            account = Account.objects.get(user=user)
            teammember = TeamMember.objects.get(team=team, member=account)
            teammembers = TeamMember.objects.filter(team=team)
            with transaction.atomic():
                teammember.delete()
                teammembers = TeamMember.objects.filter(team=team)
                if teammembers.count() == 0:
                    team.delete()
            return Response({'status': 'success'})

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'
        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)


class TeamInviteUpdateView(APIView):
    '''
    url  : /team/api/team-invite-update

    POST : 팀 지원 및 팀원 초대시 생성되는 TeamInviteMessage의 변경 요청을 처리

        Request  :
            target_team_id : <요청 팀 ID>
            direction : <TO_USER/TO_ACCOUNT>

        Response :
        {
            "status" : <success/fail>
            # FAIL
            "msg" : <상태메세지>,
            "errors" : <에러리스트>
        }
    '''

    def post_validation(self, request, status, errors):
        user = request.user
        message_id = request.data.get('message_id')

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        else:
            try:
                apply_msg = TeamInviteMessage.objects.get(id=message_id)
                if apply_msg.account_id != request.user.id:
                    errors["teaminvitemessage_user_missmatch"] = "잘못된 접근입니다. 메세지의 주인이 아닙니다."
                    status = 'fail'
            except TeamInviteMessage.DoesNotExist:
                errors["teaminvitemessage_not_found"] = "해당 초대메세지를 찾을 수 없습니다. "
                status = 'fail'

        return status, errors

    def post(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = \
            self.post_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions

        target_team_id = request.data.get('target_team_id')
        team = Team.objects.get(id=target_team_id)
        account = Account.objects.get(user=request.user)
        direction = request.data.get('direction')
        try:
            apply_msg = TeamInviteMessage.objects.get(
                team=team, account=account, direction=direction, status=0)
            with transaction.atomic():
                if request.data.get('is_okay') == "true":
                    status = 1  # 승인
                    TeamMember.objects.create(team=team, member=account)
                else:
                    status = 2  # 거절
                apply_msg.status = status
                apply_msg.save()

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'
        except:
            errors['undefined_exception'] = 'undefined_exception'
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)


class TeamInviteDeleteView(APIView):
    '''
    url  : /team/api/team-invite-delete

    POST : 팀 지원서 및 팀원 초대장 삭제 요청을 처리

        Request  :
            message_id : <요청 메세지 ID>

        Response :
        {
            "status" : <success/fail>
            # FAIL
            "msg" : <상태메세지>,
            "errors" : <에러리스트>
        }
    '''

    def post_validation(self, request, status, errors):
        user = request.user
        message_id = request.data.get('message_id')

        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            try:
                apply_msg = TeamInviteMessage.objects.get(id=message_id)
                if apply_msg.account_id != request.user.id:
                    errors["teaminvitemessage_user_missmatch"] = "잘못된 접근입니다. 메세지의 주인이 아닙니다."
                    status = 'fail'
            except TeamInviteMessage.DoesNotExist:
                errors["teaminvitemessage_not_found"] = "해당 초대메세지를 찾을 수 없습니다. "
                status = 'fail'

        return status, errors

    def post(self, request, *args, **kwargs):
        # Declaration
        data = {}
        errors = {}
        status = 'success'

        # Request Validation
        status, errors = \
            self.post_validation(request, status, errors)

        if status == 'fail':
            res = {'status': status, 'errors': errors}
            return Response(res)

        # Transactions
        message_id = request.data.get('message_id')
        apply_msg = TeamInviteMessage.objects.get(id=message_id)
        print(request.user.id, apply_msg.account_id)

        try:
            with transaction.atomic():
                apply_msg.delete()

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'
        except:
            errors['undefined_exception'] = 'undefined_exception'
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}

        return Response(res)
