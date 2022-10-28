from django.db import transaction, DatabaseError
from django.shortcuts import render, resolve_url
from django.http import JsonResponse
from django.core.files.images import get_image_dimensions
from django.template.loader import render_to_string
from .models import Team, TeamMember, TeamTag, TeamInviteMessage
from tag.models import Tag
from user.models import Account
from community.models import Board
from message.models import Message

from datetime import datetime


def teamInviteValidation(user, username, team_id, invite_msg):
    '''
    팀 초대 시 가져온 사용자의 입력 값에 대하여 validation을 수행
    validation 결과가 오류일 경우에 사용자에게 오류메세지를 전달

    Returns:
        field_check_list, is_valid

    Caller :
        TeamInvite
    '''

    is_valid = True
    field_check_list = {}

    
    if user.is_anonymous:
        is_valid = False
    if username=='null':
        is_valid = False
        field_check_list['name'] = '필수 입력값입니다.'
    else:
        try:
            Account.objects.get(user__username=username)
        except:
            is_valid = False

    # Team Name Check
    if team_id=='null':
        is_valid = False
        field_check_list['name'] = '필수 입력값입니다.'
    else:
        try:
            Team.objects.get(id=team_id)
        except:
            is_valid = False
            pass

    if len(invite_msg) > 150:
        is_valid = False
        field_check_list['desc'] = f'초대 메세지은 이상 50자 이하입니다. 현재 {len(invite_msg)}자'

    return field_check_list, is_valid


def teamInfoValidation(team_name, team_desc, team_img):
    '''
    팀 정보 생성/수정 시 가져온 사용자의 입력 값에 대하여 validation을 수행
    validation 결과가 오류일 경우에 사용자에게 오류메세지를 전달

    Returns:
        field_check_list, is_valid

    Caller :
        TeamCreate, TeamUpdate
    '''
    is_valid = True
    field_check_list = {}

    # Team Name Check
    if not team_name:
        is_valid = False
        field_check_list['name'] = '필수 입력값입니다.'
    else:
        pass

    if not team_desc:
        is_valid = False
        field_check_list['desc'] = '필수 입력값입니다.'
    else:
        if len(team_desc) < 30 or len(team_desc) > 150:
            is_valid = False
            field_check_list['desc'] = f'팀 설명은 30자 이상 150자 이하입니다. 현재 {len(team_desc)}자'

    if team_img:
        img_width, img_height = get_image_dimensions(team_img)
        if img_width > 500 or img_height > 500:
            is_valid = False
            field_check_list['image'] = f'이미지 크기는 500px x 500px 이하입니다. 현재 {img_width}px X {img_height}'

    return field_check_list, is_valid




def TeamInvite(request):
    '''
    팀원 초대 창
    url       : /team/api/team-invite
    template  : team/invite-form.html

    Returns :
        GET  : render
        POST : JsonResponse

    '''
    if request.method == 'GET':


        # 팀원 초대장 팝업창 렌더링
        # context 정보
        # invite_user       : 초대 대상 유저의 Account 객체 ( 초대 대상 유저의 user_id로 쿼리)
        # invite_team       : 초대 팀의 Team 객체 ( 초대 할 팀의 team_id로 쿼리 )
        # recommend_team    : ???

        context = {
            'invite_user': Account.objects.filter(user__id=request.GET.get('user_id')).first(),
            'invite_team': Team.objects.filter(id=request.GET.get('team_id')).first(),
            'recommend_team' : request.GET.get('recommend_team'),
            }
        return render(request, 'team/invite-form.html',context)

    if request.method == 'POST':

        # 팀원 초대 메시지 객체 생성

        # username          : 초대 대상 유저의 username
        # team_id           : 초대 팀의 team_id
        # invite_msg        : 팀 초대 메세지 본문

        username = request.POST.get('username', False)
        team_id = request.POST.get('team_id', False)
        invite_msg = request.POST.get('invite_msg', False)

        # Invite의 Validation 체크
        field_check_list, is_valid = teamInviteValidation(request.user, username, team_id, invite_msg)


        # 초대 대상이 이미 해당팀의 팀원일 경우 is_valid=False
        if is_valid and TeamMember.objects.filter(member__user__username=username, team__id=team_id):
            is_valid = False

        if is_valid:
            try:
                with transaction.atomic():

                    # team      : 초대 팀의 Team 객체 ( team_id 로 쿼리 )
                    # account   : 초대 대상의 Account 객체 ( username 으로 쿼리 )

                    team = Team.objects.get(id=team_id)
                    account = Account.objects.get(user__username=username)

                    # 팀원 초대 메세지 객체 생성
                    TeamInviteMessage.objects.create(
                        team = team,
                        account = account,
                        message = invite_msg,
                        direction = True,
                        send_date = datetime.now(),
                    )

                    # noti - 자동생성 (signals)
                    # msg

                    # board     : 초대대상 팀 Board 객체 ( team Team 객체로 쿼리 )
                    # url       : 메세지 url ( board.name, board.id로 생성 )
                    # sender    : 발송자 Account 객체 ( request.user 로 쿼리 )

                    board = Board.objects.get(team=team)
                    url = resolve_url('community:Board', board_name=board.name, board_id=board.id)
                    sender = Account.objects.get(user=request.user)

                    # 메세지 객체 생성
                    Message.objects.create(
                        sender=sender,
                        receiver=account,
                        body=f"[{team.name}] 초대장이 있습니다.<br><a href='{url}'>링크</a>를 확인해주세요.<br> 초대 메세지:"+invite_msg,
                        send_date = datetime.now(),
                        receiver_read = False,
                        sender_delete = False,
                        receiver_delete = False
                    )

                    # 요청 성공, status : sccess 리턴
                    return JsonResponse({'status': 'success'})

            except DatabaseError:
                # Database Exception handling
                field_check_list['DB'] = 'DB Error'
                
                # 요청 실패 / status : fail, error list 리턴
                return JsonResponse({'status': 'fail', 'errors': field_check_list})
        else:
            # 요청 실패 / status : fail, error list 리턴
            return JsonResponse({'status': 'fail', 'errors': field_check_list})



def TeamCreate(request):
    '''
    팀 생성
    url       : /team/api/team-create
    template  : team/create-form.html

    Returns :
        GET  : render
        POST : JsonResponse

    '''
    if request.method == 'GET':
        # 팀 생성 팝업창 랜더링
        return render(request, 'team/create-form.html')

    if request.method == 'POST':
        # 팀 생성 요청 처리

        # team_name : 생성할 팀 이름
        # team_desc : 생성할 팀 설명
        # team_img  : 생성할 팀의 이미지

        team_name = request.POST.get('name', False)
        team_desc = request.POST.get('desc', False)
        team_img = request.FILES.get('image', False)

        # Invite의 Validation 체크
        field_check_list, is_valid = teamInfoValidation(team_name,team_desc,team_img)

        if is_valid:
            try:
                with transaction.atomic():
                    if team_img:
                        # team_img를 입력 받았을 시
                        # image 가 포함된 Team 객체 생성
                        new_team = Team.objects.create(
                            name=team_name,
                            description=team_desc,
                            image=team_img,
                            create_date=datetime.now()
                        )
                    else:
                        # team_img를 입력 받지 않을시
                        # imager가 포함되지 않은 Team 객체 생성 ( dedault = img/team/default.jpg )
                        new_team = Team.objects.create(
                            name=team_name,
                            description=team_desc,
                            create_date=datetime.now()
                        )

                    # 생성한 team 객체 DB 저장
                    new_team.save()

                    # 팀 생성한 유저 Account 객체 ( request.user 로 쿼리 )
                    account = Account.objects.get(user=request.user)

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
                    return JsonResponse({'status': 'success'})

            except DatabaseError:
                field_check_list['DB'] = 'DB Error'
                # 요청 실패 / status : fail, error list 리턴
                return JsonResponse({'status': 'fail', 'errors': field_check_list})
        else:
            # 요청 실패 / status : fail, error list 리턴
            return JsonResponse({'status': 'fail', 'errors': field_check_list})




def TeamUpdate(request):
    '''
    팀 정보 업데이트
    url       : /team/api/team-update
    template  : team/update-form.html

    Returns:
        GET     : render
        POST    : JsonResponse
        others  : JsonResponse
    '''
    if request.method == 'GET':

        # team_id   : 업데이트할 팀의 team_id
        # team      : 업데이트할 팀의 Team 객체 ( team_id로 쿼리) 

        context = {}
        team_id=request.GET.get('team_id')
        team = Team.objects.get(id=team_id)
        context['team'] = team
        context['team_members'] = TeamMember.objects.filter(team=team).select_related('member')

        return render(request, 'team/update-form.html', context)

    if request.method == 'POST':

        team_id=request.POST.get('team_id')
        team = Team.objects.get(id=team_id)

        # validation
        team_name = request.POST.get('team-name', False)
        team_desc = request.POST.get('team-desc', False)
        team_img = request.FILES.get('team-image', False)

        field_check_list, is_valid = teamInfoValidation(team_name, team_desc, team_img)

        if not is_valid:
            for msg in field_check_list.values():
                return JsonResponse({'status':'fail', 'message':msg})

        try:
            with transaction.atomic():

                # team update
                team.name = team_name
                team.description = team_desc
                if team_img: 
                    team.image = team_img
                team.save()

                # teamMember create and update
                admin_list = request.POST.get('admin_list').split(',')
                for x in admin_list:
                    if not x:
                        admin_list = []
                        break
                member_list = request.POST.get('member_list').split(',')
                for x in member_list:
                    if not x:
                        member_list = []
                        break
                member_list_old = list(TeamMember.objects.filter(team=team).values_list('member__user__username', flat=True))

                for member_name in list(set(member_list_old) - set(member_list)):
                    account = Account.objects.get(user__username=member_name)
                    TeamMember.objects.get(member=account, team=team).delete()
                # for member_name in list(set(member_list) - set(member_list_old)):
                #     account = Account.objects.get(user__username=member_name)
                #     is_admin = member_name in admin_list
                #     TeamMember.objects.create(team=team, account=account, is_admin=is_admin)
                for member_name in member_list:
                    teammember = TeamMember.objects.get(team=team, member__user__username=member_name)
                    teammember.is_admin = member_name in admin_list
                    teammember.save()

                # teamTag create and delete
                tag_list = request.POST.get('category_tag_list').split(',')
                tag_list_old = list(TeamTag.objects.filter(team=team).values_list('tag__name', flat=True))

                for tag in tag_list:
                    if not tag:
                        tag_list = []
                        break
                for tag_name in list(set(tag_list_old) - set(tag_list)):
                    TeamTag.objects.get(team=team, tag__name=tag_name).delete()
                for tag_name in list(set(tag_list) - set(tag_list_old)):
                    tag = Tag.objects.get(name=tag_name)
                    TeamTag.objects.create(team=team, tag=tag)


                if len(TeamMember.objects.filter(team=team, is_admin=True)) == 0:
                    raise DatabaseError('팀 관리자는 0명이 될 수 없습니다.')
                team.save()
                return JsonResponse({'status': 'success'})
        except DatabaseError as e:
            return JsonResponse({'status': 'fail', 'message': str(e)})




def TeamApply(request, team_id):
    '''
    팀 가입 팝업창
    url       : /team/api/team-apply/<int:team_id>
    template  : team/apply-form.html
    
    Returns :
        GET     : render
        POST    : JsonResponse
        others  : JsonResponse
    '''
    if request.method == 'GET':
        context = {}
        team = Team.objects.get(id=team_id)
        context['team'] = team
        return render(request, 'team/apply-form.html', context)
    if request.method == 'POST':
        team = Team.objects.get(id=team_id)
        account = Account.objects.get(user=request.user)
        teammember = TeamMember.objects.filter(team=team,member=account)
        if not teammember:
            try:
                with transaction.atomic():
                    message = request.POST.get('desc')
                    TeamInviteMessage.objects.create(team=team,
                                                     account=account,
                                                     message=message,
                                                     status=0, # 대기중
                                                     direction=False, # FROM ACCOUNT TO_TEAM
                                                     send_date=datetime.now(),
                                                     )

                    return JsonResponse({'status': 'success'})
            except DatabaseError as e:
                return JsonResponse({'status': 'fail', 'message': str(e)})
        else:
            return JsonResponse({'status': 'fail', 'message': "기존 팀원은 지원할 수 없습니다."})

def TeamApplyList(request):
    '''
    팀 초대장/가입 신청서 목록렌더링
    url : /team/api/team-apply-list
    template : team/apply-list.html

    Returns :
        render
    '''
    if request.method == 'GET':
        return render(request, 'team/apply-list.html')

def TeamOut(request):
    '''
    팀 탈퇴 요청 처리
    url : /team/api/team-out

    Returns :
        JsonResponse
    '''
    if request.method == 'POST':
        team = Team.objects.get(id=request.POST.get('team_id'))
        account = Account.objects.get(user__username=request.POST.get('username'))
        teammember = TeamMember.objects.get(team=team,member=account)
        teammembers = TeamMember.objects.filter(team=team)

        # 탈퇴 가능 조건: 팀에 멤버가 한명(자기자신), 팀멤버가 여러명이나 admin이 아님
        if teammembers.count()>1 and teammember.is_admin:
            return JsonResponse({'status': 'fail', 'message': '멤버가 여러명일 경우 admin은 탈퇴가 불가능합니다.\nadmin을 해제해주세요.'})
        try:
            with transaction.atomic():
                teammember.delete()
                teammembers = TeamMember.objects.filter(team=team)
                if teammembers.count()==0:
                    team.delete()
            return JsonResponse({'status': 'success'})

        except DatabaseError as e:
            return JsonResponse({'status': 'fail', 'message': str(e)})


def TeamInviteUpdate(request):
    '''
    팀 지원 및 팀원 초대시 생성되는 TeamInviteMessage의 변경 요청을 처리
    url : /team/api/team-invite-update

    Returns :
        JsonResponse
    '''
    if request.method == 'POST':
        team = Team.objects.get(id=request.POST.get('team_id'))
        account = Account.objects.get(user__username=request.POST.get('username'))
        direction = request.POST.get('direction') == 'TO_ACCOUNT'
        apply_msgs = TeamInviteMessage.objects.filter(team=team,account=account,direction=direction, status=0)
        try:
            with transaction.atomic():
                if request.POST.get('is_okay')=="true":
                    status = 1  # 승인
                    TeamMember.objects.create(team=team,member=account)
                else:
                    status = 2  # 거절
                for apply_msg in apply_msgs:
                    apply_msg.status = status
                    apply_msg.save()

                data = render_to_string('team/apply-list.html',request=request)
                return JsonResponse({'status': 'success','data':data,'username':request.POST.get('username')})
        except DatabaseError as e:
            return JsonResponse({'status': 'fail', 'message': str(e)})

def TeamInviteDelete(request):
    '''
    팀 지원서 및 팀원 초대장 삭제 요청을 처리
    url : /team/api/team-invite-delete

    Retruns:
        JsonResponse
    '''
    if request.method == 'POST':
        msg_id = request.POST.get('msg_id')
        apply_msg = TeamInviteMessage.objects.get(id=msg_id)
        print(request.user.id, apply_msg.account_id)
        if apply_msg.account_id != request.user.id:
            return JsonResponse({'status': 'fail', 'message': 'Not Authorized Request'})
        try:
            with transaction.atomic():
                apply_msg.delete()
                return JsonResponse({'status': 'success'})
        except DatabaseError as e:
            return JsonResponse({'status': 'fail', 'message': str(e)})
