from django.db import connection
from django.db.models import Count
from rest_framework.response import Response
from rest_framework.views import APIView

from challenge.models import Challenge, ChallengeAchieve
from challenge.serializers import (ChallengeAchieveSerializer,
                                   ChallengeSerializer)
from user.models import Account, User
from user.serializers import AccountSerializer
from osp.settings import K_COIN_SECRET
import datetime
import jwt

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
            account__user=target_user_id)

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
            # 달성한 사람이 없는 경우 핸들링
            if ch_id in achieve_id_cnt:
                achievement['total_achievement'] = achieve_id_cnt[ch_id]
            else:
                achievement['total_achievement'] = 0
        data['achievements'] = achievements
        res['data'] = data

        return Response(res)


class AchievementUpdateView(APIView):
    '''
    유저의 도전과제 달성 여부 업데이트
    '''

    def get(self, request, target_user_id):
        res = {'status': 'success', 'message': '', 'data': []}
        data = {}

        try:
            challenges = Challenge.objects.all()
            account = Account.objects.get(user=target_user_id)
            for challenge in challenges:
                achievement_check(account, challenge)

        except Exception as e:
            print(f"AchievementUpdateView: {e}")
            res['status'] = 'fail'
            res['message'] = '도전과제 업데이트에 실패했습니다'
        res['message'] = '도전과제 업데이트에 성공했습니다'
        res['data'] = data

        return Response(res)


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


class SecretSignJWT(APIView):
    '''
    킹고 코인에 API 요청을 위해 필요한 JWT토큰 생성 및 반환환
    '''

    def get(self, request, target_user_id):
        res = {}
        try:
            token = generate_JWT(target_user_id)
            res['status'] = 'success'
            res['message'] = '토큰 생성에 성공했습니다'
            res['data'] = {
                'token': token,
            }
        except Exception as e:
            print(f"SecretSignJWT: {e}")
            res['message'] = '토큰 생성에 실패했습니다'
            res['error'] = str(e)
            return Response(res, status=500)
        return Response(res, status=200)
    
def generate_JWT(userId):
    payload = {
        "userId": userId,
        "role": "user",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=1),
    }
    token = jwt.encode(payload, K_COIN_SECRET, algorithm="HS512")
    print(token)
    print(userId)
    return token

