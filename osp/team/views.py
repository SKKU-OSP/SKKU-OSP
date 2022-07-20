from django.db import transaction, DatabaseError
from django.shortcuts import render
from django.http import JsonResponse
from django.core.files.images import get_image_dimensions
from django.template.loader import render_to_string

from .models import Team, TeamMember, TeamTag, TeamInviteMessage
from tag.models import Tag
from user.models import Account
from community.models import Board

from datetime import datetime

def teamInfoValidation(team_name, team_desc, team_img):
    is_valid = True
    field_check_list = {}
    # Team Name Check
    if not team_name:
        is_valid = False
        field_check_list['name'] = '필수 입력값입니다.'
    else:
        for default_name in Board.DEFAULT_BOARDNAME:
            if default_name == team_name:
                is_valid = False
                field_check_list['name'] = f'{team_name}은 이름으로 사용할 수 없습니다.'
                break

    if not team_desc:
        is_valid = False
        field_check_list['desc'] = '필수 입력값입니다.'
    else:
        if len(team_desc) < 30 or len(team_desc) > 150:
            is_valid = False
            field_check_list['desc'] = f'팀 설명은 30자 이상 150자 이하입니다. 현재 {len(team_desc)}자'
    # print(request.FILES)

    if team_img:
        img_width, img_height = get_image_dimensions(team_img)
        if img_width > 500 or img_height > 500:
            is_valid = False
            field_check_list['image'] = f'이미지 크기는 500px x 500px 이하입니다. 현재 {img_width}px X {img_height}'

    return field_check_list, is_valid

# Create your views here.
def TeamCreate(request):
    if request.method == 'GET':
        return render(request, 'team/create-form.html')
    if request.method == 'POST':
        team_name = request.POST.get('name', False)
        team_desc = request.POST.get('desc', False)
        team_img = request.FILES.get('image', False)

        field_check_list, is_valid = teamInfoValidation(team_name,team_desc,team_img)

        if is_valid:
            try:
                with transaction.atomic():
                    if team_img:
                        new_team = Team.objects.create(
                            name=team_name,
                            description=team_desc,
                            image=team_img,
                            create_date=datetime.now()
                        )
                    else:
                        new_team = Team.objects.create(
                            name=team_name,
                            description=team_desc,
                            create_date=datetime.now()
                        )
                    new_team.save()
                    account = Account.objects.get(user=request.user)
                    team_member = TeamMember.objects.create(
                        team=new_team,
                        member=account,
                        is_admin=True,
                    )
                    team_member.save()
                    Board.objects.create(
                        name=team_name,
                        board_type='Team',
                        anonymous_writer=False,
                        team=new_team,
                    )
                    return JsonResponse({'status': 'success'})
            except DatabaseError:
                field_check_list['DB'] = 'DB Error'
                return JsonResponse({'status': 'fail', 'errors': field_check_list})
        else:
            # print(field_check_list)
            return JsonResponse({'status': 'fail', 'errors': field_check_list})

def TeamUpdate(request):
    if request.method == 'GET':
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
                team.desc = team_desc
                if team_img: team.image = team_img
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
                return JsonResponse({'status': 'success'})
        except DatabaseError as e:
            return JsonResponse({'status': 'fail', 'message': str(e)})


def TeamApply(request, team_id):
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

def TeamInviteUpdate(request):
    if request.method == 'POST':
        team = Team.objects.get(id=request.POST.get('team_id'))
        account = Account.objects.get(user__username=request.POST.get('username'))
        direction = request.POST.get('direction') == 'TO_ACCOUNT'
        apply_msg = TeamInviteMessage.objects.get(team=team,account=account,direction=direction)
        try:
            with transaction.atomic():
                if request.POST.get('is_okay'):
                    status = 1  # 승인
                else:
                    status = 2  # 거절

                apply_msg.status = status
                apply_msg.save()

                data = render_to_string('community/board/apply-tab.html',{'team':team},request=request)
                return JsonResponse({'status': 'success','data':data})
        except DatabaseError as e:
            return JsonResponse({'status': 'fail', 'message': str(e)})
        else:
            return JsonResponse({'status': 'fail', 'message': "기존 팀원은 지원할 수 없습니다."})


