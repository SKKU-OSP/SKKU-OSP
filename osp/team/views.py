from django.shortcuts import render
from django.http import JsonResponse
from django.core.files.images import get_image_dimensions
from .models import Team, TeamMember
from user.models import Account
from community.models import Board
from datetime import datetime

# Create your views here.
def TeamCreate(request):
    if request.method == 'GET':
        return render(request, 'team/create_form.html')
    if request.method == 'POST':
        print(request.POST)
        is_valid = True
        field_check_list = {}
        
        # Team Name Check
        team_name = request.POST.get('name', False)
        if not team_name:
            is_valid = False
            field_check_list['name'] = '필수 입력값입니다.'
        else:
            if len(Team.objects.filter(name=team_name)):
                is_valid = False
                field_check_list['name'] = f'{team_name} 팀은 이미 존재합니다.'
            if len(Board.objects.filter(name=team_name)):
                is_valid = False
                field_check_list['name'] = f'{team_name}은 이름으로 사용할 수 없습니다.'
        
        team_desc = request.POST.get('desc', False)
        if not team_desc:
            is_valid = False
            field_check_list['desc'] = '필수 입력값입니다.'
        else:
            if len(team_desc) < 30 or len(team_desc) > 150:
                is_valid = False
                field_check_list['desc'] = f'팀 설명은 30자 이상 150자 이하입니다. 현재 {len(team_desc)}자'
        print(request.FILES)
        
        team_img = request.FILES.get('image', False)
        if team_img:
            img_width, img_height = get_image_dimensions(team_img)
            if img_width > 500 or img_height > 500:
                is_valid = False
                field_check_list['image'] = f'이미지 크기는 500px x 500px 이하입니다. 현재 {img_width}px X {img_height}'
        if is_valid:
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
        else:
            print(field_check_list)
            return JsonResponse({'status': 'fail', 'errors': field_check_list})
