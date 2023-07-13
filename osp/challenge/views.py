from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.db import connection
from django.db.models import Count
from django.contrib.auth.decorators import login_required

from rest_framework.response import Response
from rest_framework.views import APIView

from user.models import Account, StudentTab, User
from user.serializers import AccountSerializer
from challenge.models import Challenge, ChallengeAchieve
from challenge.serializers import ChallengeSerializer, ChallengeAchieveSerializer


class ChallengeListView(APIView):
    '''
    도전과제의 리스트를 받아오는 API
    '''

    def get(self, request):
        res = {'status': 'success', 'message': '', 'data': []}
        data = {}
        challenges = Challenge.objects.values(
            'id', 'name', 'description', 'tier')
        data['challenges'] = ChallengeSerializer(challenges, many=True).data
        res['data'] = data

        return Response(res)


class ChallengeAchieveView(APIView):
    '''
    유저의 도전과제 달성여부 API
    원래는 request.user를 타겟으로 해야하지만,
    테스트 용으로 target_user_id 를 받아 해당 유저의 도전과제 달성여부 반환
    '''

    def get(self, request, target_user_id):
        res = {'status': 'success', 'message': '', 'data': []}
        data = {'account': None, 'achievements': [], 'total_accounts': 1}

        # 유저 정보
        account = Account.objects.get(user=target_user_id)
        data['account'] = AccountSerializer(account).data
        # 전체 계정 수 구하기
        account_cnt = len(User.objects.filter(is_superuser=False))
        data['total_accounts'] = account_cnt

        # 유저의 도전과제 달성 정보
        achieves = ChallengeAchieve.objects.filter(
            account__user=target_user_id)  # .select_related('challenge')

        # 새로운 challenge가 있으면 달성여부 확인
        achieved_challenge_ids = achieves.values_list(
            "challenge__id", flat=True)
        for unattained_challenge in Challenge.objects.exclude(id__in=achieved_challenge_ids):
            achievement_check(account, unattained_challenge)
            achieves = ChallengeAchieve.objects.filter(
                account=account)

        # achieve id와 challenge id를 연결하는 딕셔너리 생성
        achieve_cnt = {}
        achievements = ChallengeAchieveSerializer(achieves, many=True).data
        for achievement in achievements:
            achieve_cnt[achievement['id']] = achievement['challenge']['id']

        # 달성한 계정 개수 구하기
        achieve_cnts = ChallengeAchieve.objects.exclude(acheive_date__isnull=True).values(
            'challenge__id').annotate(achieve_cnt=Count('id'))
        achieve_id_cnt = {
            achieve['challenge__id']: achieve['achieve_cnt'] for achieve in achieve_cnts}

        # achieve에 달성한 계정 개수 넣기
        for achievement in achievements:
            ch_id = achieve_cnt[achievement['id']]
            achievement['total_achievement'] = achieve_id_cnt[ch_id]
        data['achievements'] = achievements
        res['data'] = data

        return Response(res)


@login_required
def challenge_list_view(request):
    try:
        achieve_list = ChallengeAchieve.objects.filter(
            account__user=request.user).select_related('challenge')
        my_acc = Account.objects.get(user=request.user.id)
        new_challenge = achieve_list.values_list('challenge', flat=True)
        for challenge in Challenge.objects.exclude(id__in=new_challenge):
            achievement_check(my_acc, challenge)
            achieve_list = ChallengeAchieve.objects.filter(
                account__user=request.user).select_related('challenge')
        context = {
            'achieved_list': [],
            'not_achieved_list': []
        }
        achieve_cnt_query = '''
            select challenge_id as id, Count(*) as achieve_cnt
            from challenge_challengeachieve 
            where acheive_date IS NOT NULL
            group by challenge_id;
        '''
        achieve_cnt = {}
        for x in ChallengeAchieve.objects.raw(achieve_cnt_query):
            achieve_cnt[x.id] = x.achieve_cnt
        account_cnt = len(Account.objects.all())
        context['account_cnt'] = account_cnt
        for achievement in achieve_list:
            achievement.width = achievement.progress / \
                achievement.challenge.max_progress * 100
            achievement.total = achieve_cnt[achievement.challenge.id] if achievement.challenge.id in achieve_cnt else 0
            if achievement.challenge.max_progress > achievement.progress:
                context['not_achieved_list'].append(achievement)
            else:
                context['achieved_list'].append(achievement)
        context['total'] = len(context['not_achieved_list']
                               ) + len(context['achieved_list'])
        context['total_cnt'] = len(StudentTab.objects.all())

        return render(request, 'challenge/main.html', context)

    except Exception as e:
        # 관리자 혹은 수집데이터가 없을 떄
        print("e", e)
        return redirect("./forbidden")


@login_required
def challenge_acheive_update(request):
    challenge_list = Challenge.objects.all()
    my_acc = Account.objects.get(user=request.user.id)
    acheive_list = ChallengeAchieve.objects.filter(account=my_acc)
    acheive_id_list = acheive_list.values_list('challenge__id', flat=True)
    print(acheive_id_list)
    for challenge in challenge_list:
        try:
            achievement_check(my_acc, challenge)
        except:
            return JsonResponse({'status': 'fail', 'message': 'DB Fail'})
    return JsonResponse({'status': 'success'})


def achievement_check(user: Account, challenge: Challenge):
    sql_with_format = challenge.sql.replace(
        '{{github_id}}', user.student_data.github_id)
    sql_with_format = sql_with_format.replace('{{user_id}}', str(user.user_id))
    acheive_list = ChallengeAchieve.objects.filter(account=user)
    acheive_id_list = acheive_list.values_list('challenge__id', flat=True)
    try:
        cursor = connection.cursor()
        cursor.execute(sql_with_format)
        result = cursor.fetchall()[0]
        if challenge.id in acheive_id_list:
            acheive = acheive_list.get(challenge=challenge)
            acheive.progress = result[0]
            acheive.acheive_date = result[1]
        else:
            acheive = ChallengeAchieve.objects.create(
                account=user,
                challenge=challenge,
                progress=result[0],
                acheive_date=result[1]
            )
        acheive.save()
    except:
        connection.rollback()


def forbidden_page(request):
    return render(request, 'challenge/forbidden.html')
