from rest_framework.response import Response
from rest_framework.views import APIView

from user.models import Account, AccountInterest
from user.serializers import AccountSerializer, AccountInterestSerializer

import logging


class UserInterestTagListView(APIView):
    def get(self, request, user_id):
        res = {'status': None, 'message': None, 'data': None}
        data = {'account': None, 'interest_tags': []}
        try:

            account = Account.objects.get(user_id=user_id)
            account_tags = AccountInterest.objects.filter(account=account)

            data['account'] = AccountSerializer(account).data

            data['interest_tags'] = AccountInterestSerializer(
                account_tags, many=True).data
            res['status'] = 'success'
            res['message'] = f'User ID {user_id}의 태그'
            res['data'] = data
        except Exception as e:
            logging.exception(f'UserInterestTagListView Exception: {e}')

        return Response(res)
