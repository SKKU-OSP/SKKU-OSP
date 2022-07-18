from django.db import transaction, DatabaseError
from django.shortcuts import render
from django.http import JsonResponse
from django.core.files.images import get_image_dimensions

from .models import Team, TeamMember, TeamTag, TeamInviteMessage
from tag.models import Tag
from user.models import Account
from community.models import Board

from datetime import datetime

# Create your views here.
def TeamCreate(request):
    if request.method == 'GET':
        return render(request, 'team/create-form.html')
    if request.method == 'POST':
        # print(request.POST)
        is_valid = True
        field_check_list = {}
        
        # Team Name Check
        team_name = request.POST.get('name', False)
        if not team_name:
            is_valid = False
            field_check_list['name'] = '필수 입력값입니다.'
        # else:
        #     if len(Team.objects.filter(name=team_name)):
        #         is_valid = False
        #         field_check_list['name'] = f'{team_name} 팀은 이미 존재합니다.'
        #     if len(Board.objects.filter(name=team_name)):
        #         is_valid = False
        #         field_check_list['name'] = f'{team_name}은 이름으로 사용할 수 없습니다.'
        
        team_desc = request.POST.get('desc', False)
        if not team_desc:
            is_valid = False
            field_check_list['desc'] = '필수 입력값입니다.'
        else:
            if len(team_desc) < 30 or len(team_desc) > 150:
                is_valid = False
                field_check_list['desc'] = f'팀 설명은 30자 이상 150자 이하입니다. 현재 {len(team_desc)}자'
        # print(request.FILES)
        
        team_img = request.FILES.get('image', False)
        if team_img:
            img_width, img_height = get_image_dimensions(team_img)
            if img_width > 500 or img_height > 500:
                is_valid = False
                field_check_list['image'] = f'이미지 크기는 500px x 500px 이하입니다. 현재 {img_width}px X {img_height}'
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
                        is_admin=True
                    )
                    team_member.save()
                    Board.objects.create(
                        name=team_name,
                        board_type='Team',
                        anonymous_writer=False
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
        team_name = request.GET.get('team')
        # team = Team.objects.get(name=team_name)
        team_id=request.GET.get('team-id')
        team = Team.objects.get(id=team_id)
        context['team'] = team
        context['team_members'] = TeamMember.objects.filter(team=team).select_related('member')
        return render(request, 'team/update-form.html', context)
    if request.method == 'POST':
        team_name = request.POST.get('team')
        # team = Team.objects.get(name=team_name)
        team_id=request.GET.get('team-id')
        team = Team.objects.get(id=team_id)
        try:
            with transaction.atomic():
                for key in request.POST.keys():
                    if key[:key.find('-')] == 'tagadd':
                        target_tag = key[key.find('-') + 1:]
                        target_tag = Tag.objects.get(name=target_tag)
                        TeamTag.objects.create(
                            team=team,
                            tag=target_tag
                        )
                    if key[:key.find('-')] == 'tagdelete':
                        target_tag = key[key.find('-') + 1:]
                        TeamTag.objects.filter(
                            team=team,
                            tag=target_tag
                        ).delete()
                    if key[:key.find('-')] == 'admin':
                        target_member = key[key.find('-') + 1:]
                        target_member = TeamMember.objects.get(id=target_member)
                        target_member.is_admin = True
                        target_member.save()
                    if key[:key.find('-')] == 'admindelete':
                        target_member = int(key[key.find('-') + 1:])
                        target_member = TeamMember.objects.get(id=target_member)
                        target_member.is_admin = False
                        target_member.save()
                    if key[:key.find('-')] == 'delete':
                        target_member = int(key[key.find('-') + 1:])
                        TeamMember.objects.filter(id=target_member).delete()
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
