import logging
import time
from datetime import datetime

from django.core.files.images import get_image_dimensions
from django.core.paginator import Paginator
from django.db import DatabaseError, transaction
from django.db.models import Count
from rest_framework.response import Response
from rest_framework.views import APIView

from community.models import Article, Board, TeamRecruitArticle
from handle_error import get_fail_res
from message.models import Message
from tag.models import TagIndependent
from tag.serializers import TagIndependentSerializer
from team.models import (Team, TeamApplyMessage, TeamInviteMessage, TeamMember,
                         TeamTag)
from team.recommend import get_team_recommendation
from team.serializers import (TeamApplyMessageSerializer,
                              TeamInviteMessageSerializer, TeamListSerializer,
                              TeamMemberSerializer, TeamSerializer,
                              TeamTagSerializer)
from team.utils import *
from user.models import Account, AccountPrivacy, User
from user.serializers import AccountWithInterestSerializer
from rest_framework import status as http_status


class TeamInviteOnTeamboardView(APIView):

    def get_validation(self, request, status, message, errors, valid_data, *args, **kwargs):
        team_id = request.GET.get('team_id')
        user = request.user

        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        elif (len(TeamMember.objects.filter(team__id=team_id, member=user.id).values_list('id')) == 0):
            errors['is_not_teammember'] = '해당 팀의 멤버가 아닙니다.'
            status = 'fail'

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamsInviteOnTeamboardView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        team_id = request.GET.get('team_id')
        try:
            teammembers = TeamMember.objects.filter(
                team__id=team_id).values_list('member__user__id')
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
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)

    def post_validation(self, request, status, message, errors, valid_data, *args, **kwargs):

        target_user_id = request.data.get('target_user_id', False)
        target_team_id = request.data.get('target_team_id', False)
        invite_msg = request.data.get('invite_msg', False)
        user = request.user

        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        try:
            target_team = Team.objects.get(id=target_team_id)
            valid_data['target_team'] = target_team

        except Team.DoesNotExist:
            errors['team_not_found'] = '초대할 팀이 존재하지 않습니다.'
            status = 'fail'

        try:
            target_user = User.objects.get(id=target_user_id)
            valid_data['target_user'] = target_user
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

        valid_data['target_team'] = target_team
        valid_data['target_user'] = target_user
        return status, errors, valid_data

    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, errors, valid_data\
            = self.post_validation(request, status, message, errors, valid_data)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamInviteOnTeamboardView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        target_user_id = request.data.get('target_user_id', False)
        target_team_id = request.data.get('target_team_id', False)
        invite_msg = request.data.get('invite_msg', False)

        try:
            with transaction.atomic():
                target_team = valid_data['target_team']
                target_account = Account.objects.get(
                    user__id=target_user_id)

                # 팀원 초대 메세지 객체 생성
                pre_msg = TeamInviteMessage.objects.filter(team=target_team,
                                                           account=target_account,
                                                           direction=True, status=0)
                if pre_msg.exists():
                    pre_msg = pre_msg.last()
                    pre_msg.message = invite_msg
                    pre_msg.send_date = datetime.now()
                    pre_msg.save()
                    message = "초대 메시지를 수정했습니다."
                    system_msg = "초대장이 수정되었습니다."
                else:
                    TeamInviteMessage.objects.create(
                        team=target_team,
                        account=target_account,
                        message=invite_msg,
                        direction=True,
                        send_date=datetime.now(),
                    )
                    message = "초대 메시지를 작성했습니다."
                    system_msg = "초대장이 있습니다."

                # noti - 자동생성 (signals)
                # msg

                # board     : 초대대상 팀 Board 객체 ( team Team 객체로 쿼리 )
                # url       : 메세지 url ( board.name, board.id로 생성 )
                # sender    : 발송자 Account 객체 ( request.user 로 쿼리 )

                board = Board.objects.get(team=target_team)
                url = f'/community/board/{board.name}'
                sender = Account.objects.get(user=request.user.id)

                # 메세지 객체 생성
                Message.objects.create(
                    sender=sender,
                    receiver=target_account,
                    body=f"[{target_team.name}] {system_msg}<br><a href='{url}'>링크</a>를 확인해주세요.<br> 초대 메세지:"+invite_msg,
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
        except Exception as e:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'
            logging.exception(f'undefined_exception {e}')
        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TeamInviteOnRecommendView(APIView):

    def get_validation(self, request, status, message, errors, valid_data, *args, **kwargs):
        user = request.user
        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamInviteOnRecommendView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
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
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)

    def post_validation(self, request, status, message, errors, valid_data, *args, **kwargs):

        target_user_id = request.data.get('target_user_id', False)
        target_team_id = request.data.get('target_team_id', False)
        invite_msg = request.data.get('invite_msg', False)
        user = request.user

        if not request.auth:
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

        return status, errors, target_team, target_user

    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.post_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamInviteOnRecommendView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
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
                url = f'/community/board/{board.name}'
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
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TeamCreateView(APIView):

    def get_validation(self, request, status, message, errors, valid_data, *args, **kwargs):

        user = request.user
        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamsCreateView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)

    def post_validation(self, request, status, message, errors, valid_data, *args, **kwargs):

        team_name = request.data.get('team_name', False)
        team_name = team_name.strip() if isinstance(team_name, str) else team_name
        team_description = request.data.get('team_description', False)
        team_description = ' '.join(team_description.split())
        team_image = request.FILES.get('team_image', False)

        if not request.auth:
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

        return status, message, errors, valid_data

    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.post_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamCreateView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        team_name = request.data.get('team_name', False)
        team_name = team_name.strip() if isinstance(team_name, str) else team_name
        team_description = request.data.get('team_description', False)
        team_description = ' '.join(team_description.split())
        team_image = request.FILES.get('team_image', False)
        team_tag = request.data.get('team_tag', None)

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
                if team_tag:
                    team_tag = team_tag.split(",")
                    tags = TagIndependent.objects.filter(name__in=team_tag)
                    for tag in tags:
                        TeamTag.objects.create(
                            team=new_team,
                            tag=tag
                        )
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
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TeamUpdateView(APIView):

    def get_validation(self, request, status, message, errors, valid_data, *args, **kwargs):

        user = request.user
        account = Account.objects.get(user=user)
        target_team_id = request.GET.get('target_team_id')

        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            # team = Team.objects.get(id=target_team_id)
            if status == 'success':
                try:
                    team = Team.objects.get(id=target_team_id)
                except Team.DoesNotExist as e:
                    errors['team_not_found'] = "해당 팀이 존재하지 않습니다."
                    status = 'fail'
                    logging.exception(f"team_not_found {e}")

            if status == 'success':
                try:
                    TeamMember.objects.get(team=team, member=account)
                except TeamMember.DoesNotExist:
                    errors['user_is_not_teammember'] = '해당 팀의 멤버가 아닙니다.'
                    status = 'fail'
                    logging.exception(f"user_is_not_teammember {e}")

            if status == 'success':
                try:
                    TeamMember.objects.get(
                        team=team, member=account, is_admin=1)
                except TeamMember.DoesNotExist:
                    errors['user_is_not_teamadmin'] = '해당 팀의 관리자가 아닙니다.'
                    status = 'fail'
                    logging.exception(f"user_is_not_teamadmin {e}")

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamUpdateView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
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
            data['team_tag_list'] = TeamTagSerializer(
                team_tag_list, many=True).data

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'

        except:
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)

    def post_validation(self, request, *args, **kwargs):
        status = 'success'
        errors = {}
        valid_data = {}

        target_team_id = request.data.get('target_team_id', False)

        team_name = request.data.get('team_name', False)
        team_name = team_name.strip() if isinstance(team_name, str) else team_name

        team_description = request.data.get('team_description', False)
        team_description = ' '.join(team_description.split())

        team_image = request.FILES.get('team_image', False)

        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
            return status, errors, valid_data

        # Team 존재 여부 체크
        try:
            target_team = Team.objects.get(id=target_team_id)
        except Team.DoesNotExist as e:
            logging.exception(f'Team Id {target_team_id}이 없습니다. {e}')
            errors['team_not_found'] = "해당 팀이 존재하지 않습니다."
            status = 'fail'
            return status, errors, valid_data

        # Team Name Check
        if not team_name:
            errors['team_name_empty'] = '이름은 필수 입력값입니다.'
            status = 'fail'
        elif target_team.name != team_name:
            # 이름 변경을 시도할 때, 이름 중복 체크
            team_obj = Team.objects.filter(name=team_name)
            if len(team_obj) > 0:
                errors['team_name_duplicate'] = '팀 이름이 이미 존재합니다.'
                status = 'fail'
        valid_data['team'] = target_team

        if not team_description:
            errors['team_description_empty'] = '설명은 필수 입력값입니다.'
            status = 'fail'
        else:
            if len(team_description) < 30 or len(team_description) > 150:
                errors[
                    'team_description_length'] = f'팀 설명은 30자 이상 150자 이하입니다. 현재 {len(team_description)}자'
                status = 'fail'

        if team_image:
            img_width, img_height = get_image_dimensions(team_image)
            if img_width > 500 or img_height > 500:
                # \u00d7 는 곱셈기호
                errors['team_image_too_big'] = f'이미지 크기는 500px \u00d7 500px 이하입니다. 현재 {img_width}px \u00d7 {img_height}px'

        return status, errors, valid_data

    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        valid_data = {}

        # Request Validation
        status, errors, valid_data = self.post_validation(
            request, *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = []
            for _, msg in errors.items():
                message.append(msg)
            logging.exception(
                f'TeamUpdateView validation error')
            res = {'status': status, 'message': " ".join(
                message), 'errors': errors}
            return Response(res)

        # Transactions
        team = valid_data['team']
        team_name = request.data.get('team_name', False)
        team_name = team_name.strip() if isinstance(team_name, str) else team_name
        team_description = request.data.get('team_description', False)
        print("team_description", type(team_description), team_description)
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
                admin_list = request.data.get('team_admin', [])
                for x in admin_list:
                    if not x:
                        admin_list = []
                        break
                member_list = request.data.get('team_members', [])
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
                tag_list = request.data.get('team_tags', [])
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
                    tag = TagIndependent.objects.get(name=tag_name)
                    TeamTag.objects.create(team=team, tag=tag)

                if len(TeamMember.objects.filter(team=team, is_admin=True)) == 0:
                    raise Exception('팀 관리자는 0명이 될 수 없습니다.')
                team.save()

                # 변경된 팀 정보
                data['team'] = TeamSerializer(team).data
                # 변경된 팀 태그
                team_tags = TagIndependent.objects.filter(
                    teamtag__team_id=team)
                data['team_tags'] = TagIndependentSerializer(
                    team_tags, many=True).data
                # 변경된 팀 멤버
                team_members = TeamMember.objects.filter(team=team).order_by(
                    '-is_admin').prefetch_related('member__user')
                data['team_members'] = TeamMemberSerializer(
                    team_members, many=True).data

        except DatabaseError as e:
            logging.error(f"TeamUpdateView: {e}")
            status = 'fail'
            errors['DB'] = 'DB Error'
        except Exception as e:
            logging.error(f"TeamUpdateView: {e}")
            status = 'fail'
            errors['undefined_exception'] = 'undefined_exception'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TeamApplyView(APIView):

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        errors = {}
        valid_data = {}
        user = request.user
        article_id = kwargs.get('article_id')
        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            if status == 'success':
                try:
                    article = Article.objects.get(id=article_id)

                    team_recruit_article = TeamRecruitArticle.objects.get(
                        article_id=article.id)

                except Article.DoesNotExist:
                    errors['article_not_found'] = "해당 게시글이 존재하지 않습니다."
                    status = 'fail'
                except TeamRecruitArticle.DoesNotExist:
                    errors['teamrecruitarticle_not_found'] = "해당 리크루트 게시글 관계가 존재하지 않습니다."
                    status = 'fail'

            if status == 'success':
                try:
                    team = team_recruit_article.team
                except Team.DoesNotExist:
                    errors['team_not_found'] = '더이상 존재하지 않는 팀 입니다.'
                    status = 'fail'

            if status == 'success':
                if article.period_end < datetime.now():
                    errors['teamrecruitarticle_expired'] = '만료된 팀의 모집기간입니다. '
                    status = 'fail'

        return status, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Declaration
        message = ''
        data = {}

        # Request Validation
        status, errors, valid_data = self.get_validation(
            request, *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplyView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        try:
            article_id = kwargs.get('article_id')
            article = Article.objects.get(id=article_id)
            with transaction.atomic():
                team_recruit_article = TeamRecruitArticle.objects.get(
                    article_id=article.id)
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
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)

    def post_validation(self, request, *args, **kwargs):
        status, errors, valid_data = 'success', {}, {}
        user = request.user
        article_id = kwargs.get('article_id')
        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            if status == 'success':
                try:
                    article = Article.objects.get(id=article_id)
                    team_recruit_article = TeamRecruitArticle.objects.get(
                        article_id=article.id)

                except Article.DoesNotExist:
                    errors['article_not_found'] = "해당 게시글이 존재하지 않습니다."
                    status = 'fail'
                except TeamRecruitArticle.DoesNotExist:
                    errors['teamrecruitarticle_not_found'] = "해당 리크루트 게시글 관계가 존재하지 않습니다."
                    status = 'fail'

            if status == 'success':
                try:
                    team = team_recruit_article.team
                except Team.DoesNotExist:
                    errors['team_not_found'] = '더이상 존재하지 않는 팀 입니다.'
                    status = 'fail'

            if status == 'success':
                if article.period_end < datetime.now():
                    errors['teamrecruitarticle_expired'] = '만료된 팀의 모집기간입니다. '
                    status = 'fail'

            if status == 'success':
                if is_teammember(team.id, user.id):
                    errors['user_already_teammember'] = '이미 해당 팀의 멤버입니다.'
                    status = 'fail'

        return status, errors, valid_data

    def post(self, request, *args, **kwargs):
        # Declaration
        message = ''
        data = {}

        # Request Validation
        status, errors, valid_data = self.post_validation(
            request, *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplyView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        try:
            article_id = kwargs.get('article_id')
            account = Account.objects.get(user=request.user.id)
            article = Article.objects.get(id=article_id)
            team_recruit_article = TeamRecruitArticle.objects.get(
                article_id=article.id)
            team = team_recruit_article.team
            with transaction.atomic():
                message = request.data.get('message')
                remain = TeamApplyMessage.objects.filter(
                    team=team, account=account, status=0)
                if remain.exists():
                    msg = remain.first()
                    msg.message = message
                    msg.send_date = datetime.now()
                    msg.save()
                else:
                    TeamApplyMessage.objects.create(
                        team=team,
                        account=account,
                        message=message,
                        status=0,  # 대기 중
                        direction=False,  # FROM ACCOUNT TO_TEAM
                        send_date=datetime.now(),
                    )

        except DatabaseError as e:
            logging.error(f'TeamApplyView post error: {e}')
            errors['DB'] = 'DB Error'
            status = 'fail'
        except Exception as e:
            logging.exception(f'TeamApplyView post exception: {e}')
            errors['undefined_exception'] = 'undefined_exception'
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}

        return Response(res)


class TeamOutView(APIView):

    def post_validation(self, request, status, message, errors, valid_data, *args, **kwargs):
        user = request.user
        account = Account.objects.get(user=user)
        team_name = request.data.get('team_name')

        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            if status == 'success':
                try:
                    team = Team.objects.get(name=team_name)
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

        return status, message, errors, valid_data

    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.post_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamOutView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions

        try:
            team_name = request.data.get('team_name')
            team = Team.objects.get(name=team_name)
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
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TeamInviteUpdateView(APIView):

    def post_validation(self, request, status, message, errors, valid_data, *args, **kwargs):
        user = request.user
        target_teaminvitemessage_id = request.data.get(
            'target_teaminvitemessage_id')

        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        else:
            try:
                teaminvitemessage = TeamInviteMessage.objects.get(
                    id=target_teaminvitemessage_id)
                if teaminvitemessage.account_id != request.user.id:
                    errors["teaminvitemessage_user_missmatch"] = "잘못된 접근입니다. 메세지의 주인이 아닙니다."
                    status = 'fail'
            except TeamInviteMessage.DoesNotExist:
                errors["teaminvitemessage_not_found"] = "해당 초대메세지를 찾을 수 없습니다. "
                status = 'fail'

        return status, message, errors, valid_data

    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.post_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamInviteUpdateView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions

        target_teaminvitemessage_id = request.data.get(
            'target_teaminvitemessage_id')
        account = Account.objects.get(user=request.user)
        try:
            teaminvitemessage = TeamInviteMessage.objects.get(
                id=target_teaminvitemessage_id)
            with transaction.atomic():
                if request.data.get('is_okay') == "true":
                    status = 1  # 승인
                    TeamMember.objects.create(
                        team=teaminvitemessage.team, member=account)
                else:
                    status = 2  # 거절
                teaminvitemessage.status = status
                teaminvitemessage.save()

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'
        except:
            errors['undefined_exception'] = 'undefined_exception'
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TeamInviteDeleteView(APIView):

    def post_validation(self, request, status, message, errors, valid_data, *args, **kwargs):
        user = request.user
        target_teaminvitemessage_id = request.data.get(
            'target_teaminvitemessage_id')

        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            try:
                teaminvitemessage = TeamInviteMessage.objects.get(
                    id=target_teaminvitemessage_id)
                if teaminvitemessage.account_id != request.user.id:
                    errors["teaminvitemessage_user_missmatch"] = "잘못된 접근입니다. 메세지의 주인이 아닙니다."
                    status = 'fail'
            except TeamInviteMessage.DoesNotExist:
                errors["teaminvitemessage_not_found"] = "해당 초대메세지를 찾을 수 없습니다. "
                status = 'fail'

        return status, message, errors, valid_data

    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.post_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamInviteDeleteView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        target_teaminvitemessage_id = request.data.get(
            'target_teaminvitemessage_id')
        teaminvitemessage = TeamInviteMessage.objects.get(
            id=target_teaminvitemessage_id)

        try:
            with transaction.atomic():
                teaminvitemessage.delete()

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'
        except:
            errors['undefined_exception'] = 'undefined_exception'
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TeamApplyUpdateView(APIView):

    def post_validation(self, request, *args, **kwargs):
        user = request.user
        status = 'success'
        errors, valid_data = {}, {}
        target_teamapplymessage_id = request.data.get(
            'target_teamapplymessage_id')

        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        else:
            try:
                teamapplymessage = TeamApplyMessage.objects.get(
                    id=target_teamapplymessage_id)
            except TeamApplyMessage.DoesNotExist as e:
                errors["teamapplymessage_not_found"] = "해당 지원 메시지를 찾을 수 없습니다. "
                status = 'fail'
                logging.exception(
                    f'TeamApplyUpdateView 해당 지원 메시지를 찾을 수 없습니다 : {e}')
            except Exception as e:
                status = 'fail'
                logging.exception(f'TeamApplyUpdateView validation error: {e}')

        return status, errors, valid_data

    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}

        # Request Validation
        status, errors, valid_data = self.post_validation(
            request, *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        target_teamapplymessage_id = request.data.get(
            'target_teamapplymessage_id')
        target_user_id = request.data.get('user_id')
        account = Account.objects.get(user=request.user)
        try:
            teamapplymessage = TeamApplyMessage.objects.get(
                id=target_teamapplymessage_id)
            with transaction.atomic():
                if request.data.get('is_okay') == "true":
                    teamapplymessage.status = 1  # 승인
                    TeamMember.objects.create(
                        team=teamapplymessage.team, member_id=target_user_id)
                else:
                    teamapplymessage.status = -1  # 거절
                teamapplymessage.save()

        except DatabaseError as e:
            errors['DB'] = 'DB Error'
            status = 'fail'
            logging.exception(f"TeamApplyUpdateView: {e}")
        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception'
            status = 'fail'
            logging.exception(f"TeamApplyUpdateView: {e}")

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TeamApplyDeleteView(APIView):

    def post_validation(self, request, status, message, errors, valid_data, *args, **kwargs):
        user = request.user
        target_teamapplymessage_id = request.data.get(
            'target_teamapplymessage_id')

        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            try:
                teamapplymessage = TeamApplyMessage.objects.get(
                    id=target_teamapplymessage_id)
                if teamapplymessage.account_id != request.user.id:
                    errors["teamapplymessage_user_missmatch"] = "잘못된 접근입니다. 메세지의 주인이 아닙니다."
                    status = 'fail'
            except TeamInviteMessage.DoesNotExist:
                errors["teamapplymessage_not_found"] = "해당 지원메세지를 찾을 수 없습니다. "
                status = 'fail'

        return status, message, errors, valid_data

    def post(self, request, *args, **kwargs):
        # Declaration
        status = 'success'
        message = ''
        data = {}
        errors = {}
        valid_data = {}

        # Request Validation
        status, message, errors, valid_data \
            = self.post_validation(
                request,
                status, message, errors, valid_data,
                *args, **kwargs)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplyDeleteView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        target_teamapplymessage_id = request.data.get(
            'target_teamapplymessage_id')
        teamapplymessage = TeamApplyMessage.objects.get(
            id=target_teamapplymessage_id)
        try:
            with transaction.atomic():
                teamapplymessage.delete()

        except DatabaseError:
            errors['DB'] = 'DB Error'
            status = 'fail'
        except:
            errors['undefined_exception'] = 'undefined_exception'
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TeamsListView(APIView):

    def get(self, request, *args, **kwargs):
        start = time.time()
        # Declaration
        data = {}
        # Request Validation: PASS

        sort_field = request.GET.get('sort', '-id')
        sort_field = sort_field.split(",")
        try:
            teams = Team.objects.annotate(
                member_cnt=Count('teammember')).order_by(*sort_field)

            page_size = 10
            paginator = Paginator(teams, page_size)
            page_number = request.GET.get('page_number', 1)
            teams = paginator.get_page(page_number)
            data['max_page_number'] = paginator.num_pages
            data['teams'] = TeamListSerializer(teams, many=True).data
            for team in data['teams']:
                # 팀의 관리자 계정의 id와 username 쿼리
                leader = Account.objects.filter(
                    teammember__is_admin=True, teammember__team_id=team['id']).values('user__id', 'user__username').first()
                if leader is None:
                    logging.warn(f'Team {team.get("name")} has no leader')
                    continue
                team['leader_username'] = leader['user__username']
                team['leader_id'] = leader['user__id']
        except DatabaseError as e:
            logging.exception(f'TeamsListView DatabaseError: {e}')
            return Response(get_fail_res('db_exception'))
        except Exception as e:
            logging.exception(f'TeamsListView Exception: {e}')
            return Response(get_fail_res('undefined_exception'))

        # Response
        res = {'status': 'success', 'message': '', 'data': data}
        print("elapsed time", time.time() - start)
        return Response(res)


class TeamsOfUserListView(APIView):
    def get_validation(self, request):
        status = 'success'
        error = None
        if not request.auth:
            status = 'fail'
            error = "require_login"

        return status, error

    def get(self, request, *args, **kwargs):
        # Declaration
        data = {}

        # Request Validation
        status, error = self.get_validation(request)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': error}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            return Response(get_fail_res(error))

        user = request.user
        sort_field = request.GET.get('sort', '-id')
        sort_field = sort_field.split(",")
        try:
            team_id_include_user = TeamMember.objects.filter(
                member=user.id).values_list('team_id')
            teams_of_user = Team.objects.filter(
                id__in=team_id_include_user).annotate(
                member_cnt=Count('teammember')).order_by(*sort_field)
            page_size = 30
            paginator = Paginator(teams_of_user, page_size)
            page_number = request.GET.get('page_number', 1)
            teams_of_user = paginator.get_page(page_number)
            data['max_page_number'] = paginator.num_pages
            data['teams_of_user'] = TeamListSerializer(
                teams_of_user, many=True).data
            for team in data['teams_of_user']:
                # 팀의 관리자 계정의 id와 username 쿼리
                leader = Account.objects.filter(
                    teammember__is_admin=True, teammember__team_id=team['id']).values('user__id', 'user__username').first()
                if leader is None:
                    logging.warn(f'Team {team.get("name")} has no leader')
                    continue
                team['leader_username'] = leader['user__username']
                team['leader_id'] = leader['user__id']

        except DatabaseError as e:
            logging.exception(f'TeamsOfUserListView DB Error: {e}')
            return Response(get_fail_res('db_exception'))

        except Exception as e:
            logging.exception(f'TeamsOfUserListView Exception: {e}')
            return Response(get_fail_res('undefined_exception'))

        res = {'status': status, 'message': '', 'data': data}
        return Response(res)


class TeamApplicationListView(APIView):
    def get_validation(self, request):
        status, errors = "success", {}
        user = request.user
        if not request.auth:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        return status, errors

    def get(self, request, *args, **kwargs):
        # Declaration
        message = ''
        data = {}

        # Request Validation
        status, errors = self.get_validation(request)

        if "require_login" in errors:
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res, status=http_status.HTTP_401_UNAUTHORIZED)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(
                f'TeamApplicationList validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        user = request.user
        try:
            # 유저가 팀 관리자인 팀의 목록 쿼리
            team_id_include_user = TeamMember.objects.filter(
                member=user.id, is_admin=1).values_list('team_id')

            team_apps_received = TeamApplyMessage.objects.filter(
                team__in=team_id_include_user, status=0, direction=False)

            data['received'] = TeamApplyMessageSerializer(
                team_apps_received, many=True).data

            team_apps_sent = TeamApplyMessage.objects.filter(
                account__user_id=user.id,
                direction=False,
            )

            data['sent'] = TeamApplyMessageSerializer(
                team_apps_sent, many=True).data

        except DatabaseError as e:
            # Database Exception handling
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'TeamApplicationList DB ERROR: {e}')
            status = 'fail'

        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception'
            logging.exception(f'TeamApplicationList ERROR: {e}')
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class UserRecommenderView(APIView):
    '''
    GET: 
    URL : /team/api/recommender/users/

    JSON RESPONSE
    data :
        user_teams : 소속 팀 목록 리스트
        recommended_teams : 팀 추천 리스트
        privacy : 개인정보 공개 단계
    '''

    def get_validation(self, request):
        status = 'success'
        errors = None
        user = request.user

        try:
            if not user.is_authenticated:
                errors = "require_login"
                status = 'fail'
                return status, errors
            else:
                User.objects.get(id=user.id)
        except User.DoesNotExist:
            logging.exception(f'UserRecommender user_not_found: {e}')
            errors = "user_not_found"
            status = 'fail'
        try:
            acc_pp = AccountPrivacy.objects.get(account=request.user.id)
        except Exception as e:
            logging.exception(f'UserRecommender user_privacy_not_found: {e}')
            errors = "user_privacy_not_found"
            status = 'fail'

        return status, errors

    def get(self, request, *args, **kwargs):
        start = time.time()
        res = {'status': 'success', 'data': None, 'message': ''}
        data = {}
        status, errors = self.get_validation(request)
        if status == 'fail':
            return Response(get_fail_res(errors))

        try:
            # acc_pp = AccountPrivacy.objects.get(account=request.user.id)
            # data['privacy'] = AccountPrivacySerializer(acc_pp).data
            open_acc = AccountPrivacy.objects.filter(is_open=True).exclude(
                account=request.user.id).values('account_id')
            print("open_acc", len(open_acc))
            account_list = Account.objects.filter(
                user__is_superuser=False, user__id__in=open_acc)
            print("account_list", len(account_list))
        except Exception as e:
            logging.exception(
                f"UserRecommenderView account load exception: {e}")
            errors = "해당 유저가 존재하지 않습니다."
            status = 'fail'

        # 팀 데이터 받기 전에 사용할 팀 목록 리스트를 위해 데이터를 가져온다.
        user_team_ids = list(TeamMember.objects.filter(
            member__user=request.user).values_list("team_id", flat=True))
        user_teams = Team.objects.filter(id__in=user_team_ids)
        data['teams'] = TeamSerializer(user_teams, many=True).data
        team_id = request.GET.get('team_id', None)
        recommends = None
        if len(user_teams) == 0:
            # 팀 리스트가 비어있는 경우 소속팀이 없으므로 account 리스트 반환
            recommends = AccountWithInterestSerializer(
                account_list, many=True).data
        elif team_id:
            try:
                # 팀 이름으로 객체 불러와서 그 객체에 대한 추천 유저목록 읽어서 리턴
                target_team = user_teams.filter(id=team_id).first()
                team_recommendation = get_team_recommendation(target_team.id)

                # 추천 계정에 similarity 값 추가하여 리턴
                recommend_accounts = Account.objects.filter(
                    user_id__in=team_recommendation)

                recommends = AccountWithInterestSerializer(
                    recommend_accounts, many=True).data
                for rec in recommends:
                    rec['value'] = team_recommendation[rec['user']['id']]

            except Exception as e:
                logging.exception(f"target_team exception: {e}")
                status = 'fail'
                errors = "추천 목록을 불러오는데 실패했습니다."
        else:
            recommends = AccountWithInterestSerializer(
                account_list, many=True).data

        data['recommend'] = recommends
        res['data'] = data
        print("elapsed time UserRecommenderView", time.time() - start)
        return Response(res)
