from django.db import transaction
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView

from user.models import Account, AccountInterest
from user.serializers import AccountSerializer, AccountInterestSerializer
from tag.models import TagIndependent

import logging


class UserInterestTagListView(APIView):
    def get(self, request, user_id):
        '''
        유저 관심분야 읽기 API
        '''
        res = {'status': None, 'message': None, 'data': None}
        data = {'account': None, 'interest_tags': []}
        tag_type = request.GET.get('type', None)

        filter_kwargs = {}

        if tag_type:
            tag_type = tag_type.split(",")
            if type(tag_type) == "str":
                filter_kwargs['tag__type'] = tag_type
            else:
                filter_kwargs['tag__type__in'] = tag_type

        print("tag_type", tag_type)
        try:

            account = Account.objects.get(user_id=user_id)
            filter_kwargs['account'] = account
            account_tags = AccountInterest.objects.filter(**filter_kwargs)

            data['account'] = AccountSerializer(account).data

            data['interest_tags'] = AccountInterestSerializer(
                account_tags, many=True).data
            res['status'] = 'success'
            res['message'] = f'User ID {user_id}의 태그'
            res['data'] = data
        except Exception as e:
            logging.exception(f'UserInterestTagListView Exception: {e}')

        return Response(res)


class UserInterestTagUpdateView(APIView):
    def post(self, request):
        '''
        유저 관심분야 수정 API
        '''
        res = {'status': 'fail', 'message': '', 'data': None}
        data = {'user_interests': []}
        try:
            user_account = Account.objects.get(user=request.user)
            account_interests = request.data.get('user_interests', [])

            with transaction.atomic():
                AccountInterest.objects.filter(
                    account=user_account, tag__type="domain").delete()
                objs = self.interests_updater(user_account, account_interests)
                print("objs", objs, type(objs))
                interests = AccountInterest.objects.bulk_create(objs)
                data['user_interests'] = AccountInterestSerializer(
                    interests, many=True).data
            res['data'] = data
            res['status'] = 'success'
            res['message'] = '관심분야를 수정했습니다.'

            return Response(res)

        except Exception as e:
            print("UserInterestTagListView", e)
            res['message'] = '유저 관심분야를 수정하는데 실패했습니다.'

            return Response(res)

    def interests_updater(self, account, interests):
        objs = []
        for interest in interests:
            int_tag = TagIndependent.objects.get(name=interest['value'].replace(
                "_", " ").replace("plus", "+").replace("sharp", "#"))
            new_interest_obj = AccountInterest(account=account, tag=int_tag)
            objs.append(new_interest_obj)
        return objs


class UserLangTagUpdateView(APIView):
    def post(self, request):
        '''
        유저 사용언어 기술스택 수정 API
        '''
        res = {'status': 'fail', 'message': '', 'data': None}
        data = {'user_langs': []}
        try:
            user_account = Account.objects.get(user=request.user)
            account_langs = request.data.get('user_langs', [])

            with transaction.atomic():
                AccountInterest.objects.filter(
                    account=user_account).exclude(tag__type='domain').delete()
                objs = self.langs_updater(user_account, account_langs)
                print("objs", objs, type(objs))
                updated_interests = AccountInterest.objects.bulk_create(objs)
                data['user_langs'] = AccountInterestSerializer(
                    updated_interests, many=True).data
                res['data'] = data
                res['status'] = 'success'
                res['message'] = '사용언어를 수정했습니다.'
                return Response(res)

        except Exception as e:
            print("UserInterestTagListView", e)
            res['message'] = '유저 사용언어를 수정하는데 실패했습니다.'

            return Response(res)

    def langs_updater(self, account, interests):
        objs = []
        for interest in interests:
            lang_tag = TagIndependent.objects.get(name=interest['value'].replace(
                "_", " ").replace("plus", "+").replace("sharp", "#"))
            new_interest_obj = AccountInterest(
                account=account, tag=lang_tag, level=interest['level'])
            objs.append(new_interest_obj)
        return objs
