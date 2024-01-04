from django.db import DatabaseError, transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.db.models import Q, Max, Count
from django.contrib.auth.decorators import login_required

from rest_framework.response import Response
from rest_framework.views import APIView

from message.serializers import MessageSerializer, NotificationSerializer
from user.serializers import AccountSerializer
from community.serializers import BoardSerializer
from message.models import Message, Notification
from user.models import Account
from community.models import Board

from datetime import datetime
import time
import json
import logging


class MessageRoomListView(APIView):
    '''
    채팅 상대방의 리스트를 통신 날짜를 기준으로 내림차순 정렬하여 반환
    '''

    def get(self, request, target_user_id):

        res = {"status": None, "data": None}
        try:
            data = {"chat_accounts": [], "target_account": None}
            user_account = Account.objects.get(user__id=request.user.id)

            # 받은 메시지 중 읽지 않은 메시지의 개수
            user_unread_message_counts = Message.objects.filter(
                receiver__user=user_account, receiver_read=False).values('sender').annotate(unread=Count('id'))
            user_unread_message_counts = {
                item['sender']: item['unread'] for item in user_unread_message_counts}

            # 유저가 받은 메시지의 최신 날짜
            user_receiver_messages = Message.objects.filter(Q(receiver__user=user_account)).values(
                'sender').annotate(recent_date=Max('send_date'))
            # 유저가 보낸 메시지의 최신 날짜
            user_sent_messages = Message.objects.filter(Q(sender__user=user_account)).values(
                'receiver').annotate(recent_date=Max('send_date'))

            # 받은 메시지와 보낸 메시지의 날짜 비교하여 최근 연락 날짜 구하기
            chat_dict = {m['sender']: m['recent_date']
                         for m in user_receiver_messages}
            for m in user_sent_messages:
                if m['receiver'] in chat_dict:
                    chat_dict[m['receiver']] = max(
                        chat_dict[m['receiver']], m['recent_date'])
                else:
                    chat_dict[m['receiver']] = m['recent_date']
            # 유저와 연락 기록이 있는 계정 리스트
            chat_accounts = Account.objects.filter(
                user_id__in=chat_dict.keys())

            result = [
                {
                    "account": AccountSerializer(account).data,
                    "unread": user_unread_message_counts.get(account.user.id, 0),
                    "recent_date": chat_dict.get(account.user.id).timestamp()
                }
                for account in chat_accounts
            ]

            # 날짜 내림차순 정렬
            sorted_items = sorted(
                result, key=lambda x: x['recent_date'], reverse=True)
            data['chat_accounts'] = sorted_items

            try:
                target_account = Account.objects.get(user__id=target_user_id)
                data['target_account'] = AccountSerializer(target_account).data
            except:
                data['target_account'] = None

            res = {"status": "success", "data": data}
        except Exception as e:
            logging.exception(f"MessageListView: {e}")
        return Response(res)


class MessageChatView(APIView):
    '''
    GET: 상대방과의 채팅내역 요청 처리
    POST: 상대방에게 보내는 채팅 메시지 저장 처리
    '''

    def get(self, request, target_user_id):
        res = {"status": None, "data": None}
        data = {"messages": None}
        try:
            user_account = Account.objects.get(user=request.user.id)
            target_account = Account.objects.get(user__id=target_user_id)
            before_date = request.GET.get('oldest', datetime.now())

            data['messages'] = self.get_chat_messages(
                user_account, target_account, before_date)

            res = {"status": "success", "data": data}
        except Exception as e:
            logging.exception(f"MessageChatView GET: {e}")
        return Response(res)

    def post(self, request, target_user_id):
        res = {"status": None, "data": None}
        data = {"messages": [], "new_message": None}
        try:
            user_account = Account.objects.get(user=request.user.id)
            target_account = Account.objects.get(user__id=target_user_id)

            chat_body = request.data.get('chat-input', "")

            if chat_body.strip() != "":
                with transaction.atomic():
                    new_message = Message.objects.create(
                        sender=user_account,
                        receiver=target_account,
                        body=chat_body,
                        receiver_read=False,
                        sender_delete=False,
                        receiver_delete=False
                    )
                    new_message.save()
                data['new_message'] = MessageSerializer(new_message).data
            else:
                res['status'] = 'fail'
                res['message'] = '내용이 없어서 채팅을 기록하지 못했습니다.'

                return Response(res)

        except Exception as e:
            logging.exception(f"MessageChatView POST: {e}")
            res['status'] = 'fail'
            res['message'] = e
            return Response(data)

        before_date = datetime.now()
        reload_messages = self.get_chat_messages(
            user_account, target_account, before_date)
        data['messages'] = reload_messages
        res['status'] = 'success'
        res['message'] = '메시지 전송 완료'
        res['data'] = data

        return Response(res)

    def get_chat_messages(self, user_account, target_account, before_date):
        # 유저가 보낸 메시지와 받은 메시지 모두
        messages = Message.objects.filter(
            (Q(sender=target_account, receiver=user_account) |
                Q(sender=user_account, receiver=target_account))
            & Q(send_date__lt=before_date)
        ).order_by('-send_date')[:10]

        for msg in messages:
            if msg.receiver == user_account:
                msg.receiver_read = True
                msg.save()

        return MessageSerializer(messages, many=True).data


class NotificationReadView(APIView):
    '''
    주어진 알림 id에 대한 알림을 읽음 처리하는 요청 처리
    '''

    def post(self, request, noti_id):
        res = {'status': None, 'message': None}
        try:
            target_noti = Notification.objects.filter(id=noti_id)
            if target_noti.exists():
                target_noti = target_noti.first()
                target_noti.receiver_read = True
                target_noti.save()
                res['status'] = 'success'
                return Response(res)
            else:
                res['status'] = 'fail'
                res['message'] = '해당 알림을 찾는데 실패했습니다.'
                return Response(res)
        except DatabaseError as db_error:
            logging.exception(
                f"ReadNotificationView DatabaseError: {db_error}")
            res['status'] = 'fail'
            res['message'] = '데이터베이스에 저장하는데 오류가 발생했습니다.'
            return Response(res)
        except Exception as e:
            logging.exception(f"ReadNotificationView Exception: {e}")
            res['status'] = 'fail'
            res['message'] = '작업을 완료하지 못했습니다.'
            return Response(res)


class NotificationReadAllView(APIView):
    '''
    알림을 모두 읽음 처리하는 요청 처리
    '''

    def post(self, request):
        res = {'status': None, 'message': None}
        try:
            target_notifications = Notification.objects.filter(
                receiver__user=request.user.id, receiver_read=False)
            target_notifications.update(receiver_read=True)
            res['status'] = 'success'
            return Response(res)
        except DatabaseError as db_error:
            logging.exception(
                f"ReadNotificationAllView DatabaseError: {db_error}")
            res['status'] = 'fail'
            res['message'] = '데이터베이스에 저장하는데 오류가 발생했습니다.'
            return Response(res)
        except Exception as e:
            logging.exception(f"ReadNotificationAllView Exception: {e}")
            res['status'] = 'fail'
            res['message'] = '작업을 완료하지 못했습니다.'
            return Response(res)


class ApplicationReadView(APIView):
    '''
    지원서 알림을 읽음 처리하는 요청 처리
    '''

    def post(self, request):
        res = {'status': None, 'message': None}
        try:
            user_id = request.user.id
            type_app = request.data.get('type', None)

            type_app_to_noti = {"recv": "team_apply",
                                "send": "team_apply_result"}
            if type_app not in type_app_to_noti:
                res['status'] = 'fail'
                res['message'] = '알 수 없는 type 입니다.'
                return Response(res)

            notifications = Notification.objects.filter(
                receiver=user_id, receiver_read=False, type=type_app_to_noti[type_app]).order_by('-send_date')
            notifications.update(receiver_read=True)
            res['status'] = 'success'
            return Response(res)
        except DatabaseError as db_error:
            logging.exception(f"ReadApplicationView DatabaseError: {db_error}")
            res['status'] = 'fail'
            res['message'] = '데이터베이스에 저장하는데 오류가 발생했습니다.'
            return Response(res)
        except Exception as e:
            logging.exception(f"ReadApplicationView Exception: {e}")
            res['status'] = 'fail'
            res['message'] = '작업을 완료하지 못했습니다.'
            return Response(res)


# 기존 template_tags의 message_tag 영역에 대한 API 작업
class NotificationListView(APIView):
    '''
    알림 메시지 목록과 새로운 알림 배지 렌더링 유무 반환
    '''

    def get(self, request):
        res = {"status": None, "data": None}
        data = {'show_new_noti': False, 'show_new_app': False,
                'show_new_app_result': False, 'notifications': []}
        show_new_app = False
        show_new_app_result = False
        user_id = request.user.id
        notifications = Notification.objects.filter(
            receiver__user_id=user_id).order_by('-send_date')
        show_new_noti = len(notifications.filter(receiver_read=False)) > 0

        notifications = NotificationSerializer(notifications, many=True).data
        try:
            for noti in notifications:
                if noti['type'] == 'comment':
                    noti['icon'] = 'comment'
                    noti['feedback'] = noti['route_id']
                elif noti['type'] == 'articlelike':
                    # articlelike 타입은 deprecated 알림
                    noti['icon'] = 'thumb_up'
                    noti['feedback'] = noti['route_id']
                elif noti['type'] == 'team_apply':
                    noti['icon'] = 'assignment_ind'
                    noti['feedback'] = 'team_apply'
                    if not noti['receiver_read']:
                        show_new_app = True
                elif noti['type'] == 'team_apply_result':
                    noti['icon'] = 'assignment_ind'
                    noti['feedback'] = 'team_apply'
                    if not noti['receiver_read']:
                        show_new_app_result = True
                elif noti['type'] == 'team_invite':
                    if noti['route_id'] is None:
                        continue
                    try:
                        board = Board.objects.get(team__id=noti['route_id'])
                        noti['feedback'] = BoardSerializer(board).data
                    except Board.DoesNotExist as e:
                        print(f'{noti["route_id"]} 팀의 게시판이 없습니다. {e}')
                        continue
                    noti['icon'] = 'group_add'

                elif noti['type'] == 'team_invite_result':
                    noti['icon'] = 'group_add'
                    # board = Board.objects.get(team__id=noti['route_id'])
                    # noti['feedback'] = BoardSerializer(board).data
                    noti['feedback'] = "team_invite_result"

        except Exception as e:
            logging.exception(f"Exception get_notifications: {e}")
            res['status'] = 'fail'
            return Response(res)

        data['show_new_noti'] = show_new_noti
        data['show_new_app'] = show_new_app
        data['show_new_app_result'] = show_new_app_result
        data["notifications"] = notifications
        res['data'] = data
        res['status'] = 'success'
        return Response(res)


class MessageCheckNewView(APIView):
    '''
    읽지 않은 메시지가 있는지 확인하는 API
    '''

    def get(self, request):
        data = {'show_new_message': False}
        res = {'status': 'fail', 'data': data}
        if request.user.is_anonymous:
            return Response(res)

        unread_messages = Message.objects.filter(
            receiver__user=request.user, receiver_read=False)
        data['show_new_message'] = unread_messages.exists()
        res['status'] = 'success'
        return Response(res)


@login_required
def message_list_view(request, selected_oppo):
    data = {}
    data['notification'] = []
    data['msg'] = {}
    my_acc = Account.objects.get(user=request.user.id)

    selected_opponent = None
    if selected_oppo != 0:
        selected_opponent = Account.objects.get(user__id=selected_oppo)
    msg_opponent = {}
    # 내가 가장 마지막에 보낸 메시지의 시간
    my_last_send_date = {msg.receiver: msg
                         for msg in Message.objects.filter(sender=my_acc)
                         .annotate(last_date=Max('send_date'))
                         }
    for opponent, msg in my_last_send_date.items():
        msg_opponent[msg.receiver] = {
            'unread': 0,
            'recent_date': time.mktime((msg.last_date).timetuple()),
            'last_msg': msg
        }

    # 다른 사용자에게서 받은 메시지를 가져와서 사용자 리스트를 만듦
    received_msg_list = Message.objects.filter(receiver=my_acc).exclude(
        sender=None).values_list('sender', flat=True).distinct()
    conn_acc = Account.objects.filter(user__in=received_msg_list)

    unread_cnt = 0
    for opponent in conn_acc:

        if opponent in my_last_send_date:
            last_date = my_last_send_date[opponent].send_date
            # 받은 메시지 모두 가져오고 안 읽은 메시지는 따로 필터링하여 가져옴
            msg_list = Message.objects.filter(
                sender=opponent,
                receiver=my_acc,
            ).order_by('-send_date')
            unread_msg_list = msg_list.filter(
                receiver_read=False, send_date__gt=last_date)
            unread_cnt = len(unread_msg_list)
        else:
            msg_list = Message.objects.filter(
                sender=opponent,
                receiver=my_acc,
                receiver_read=False,
            ).order_by('-send_date')
            unread_cnt = len(msg_list)

        # 최신순으로 정렬하기 위해 시각 비교 후 업데이트
        target_timestamp = time.mktime(
            (msg_list[0].send_date).timetuple()) if len(msg_list) != 0 else 1.0
        if opponent not in msg_opponent:
            msg_opponent[opponent] = {
                'unread': unread_cnt, 'recent_date': target_timestamp}
        elif msg_opponent[opponent]['recent_date'] < target_timestamp:
            msg_opponent[opponent] = {
                'unread': unread_cnt, 'recent_date': target_timestamp}

    def get_recent_date(item):
        recent_date = item[1]['recent_date']
        return recent_date

    try:
        sorted_dict = sorted(msg_opponent.items(),
                             key=get_recent_date, reverse=True)
    except Exception as e:
        sorted_dict = msg_opponent.items()
        print("fail sort msg_opponent", e)

    data['msg_opponent'] = sorted_dict
    if selected_opponent in msg_opponent or not selected_opponent:
        data['selected_new_opponent'] = None
    else:
        data['selected_new_opponent'] = selected_opponent

    return render(request, 'message/list-view.html', data)


@login_required
def message_chat_view(request, opponent):
    oppo_acc = Account.objects.get(user=opponent)
    my_acc = Account.objects.get(user=request.user.id)
    if request.method == 'GET':
        last_date = request.GET.get('oldest', datetime.now())
        raw_msg_list = Message.objects.filter(
            (Q(sender=oppo_acc, receiver=my_acc) |
             Q(sender=my_acc, receiver=oppo_acc))
            & Q(send_date__lt=last_date)
        ).order_by('-send_date')[:10]
        msg_list = []
        for msg in raw_msg_list:
            if msg.receiver == my_acc and msg.receiver_read == False:
                msg.receiver_read = True
                msg.save()
            msg_list.append({
                'id': msg.id,
                'sender': str(msg.sender),
                'sender_id': msg.sender.user_id,
                'receiver': str(msg.receiver),
                'receiver_id': msg.receiver.user_id,
                'body': str(msg.body),
                'send_date': str(msg.send_date),
                'read': str(msg.receiver_read)
            })
        return JsonResponse({'data': msg_list})
    if request.method == 'POST':
        try:
            with transaction.atomic():
                new_msg = Message.objects.create(
                    sender=my_acc,
                    receiver=oppo_acc,
                    body=request.POST.get('chat-input', ''),
                    receiver_read=False,
                    sender_delete=False,
                    receiver_delete=False
                )
                new_msg.save()
        except DatabaseError:
            err_msg = 'Internal Database Error'
            return JsonResponse({'status': 'fail', 'message': err_msg})
        msg_list = []

        return JsonResponse({'status': 'success', 'msg_id': new_msg.id, 'new_msg_list': msg_list})


def read_notification(request, noti_id):
    target = Message.objects.filter(id=noti_id)
    try:
        if len(target) > 0:
            target = target.first()
            target.receiver_read = True
            target.save()
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'fail', 'message': 'No such notification'})
    except DatabaseError:
        return JsonResponse({'status': 'fail', 'message': 'DB Failed'})


def read_notification_all(request):
    if request.method == 'POST':
        try:
            targets = Message.objects.filter(
                receiver__user=request.user.id, receiver_read=False)
            if len(targets) > 0:
                targets.update(receiver_read=True)
                return JsonResponse({'status': 'success'})
            else:
                return JsonResponse({'status': 'fail', 'message': 'No such notification'})
        except DatabaseError:
            return JsonResponse({'status': 'fail', 'message': 'DB Failed'})
        except Exception as e:
            print("read_notification_all Exception", e)
            return JsonResponse({'status': 'fail', 'message': 'Exception'})


def read_app(request):
    print("read_app")
    if request.method == 'POST':
        if request.user.is_anonymous:
            return None
        try:
            user_id = request.user.id
            type_app = request.POST.get('type', 'recv')
            new_msgs = Message.objects.filter(
                sender__isnull=True, receiver=user_id, receiver_read=False).order_by('-send_date')
            type_target = 'team_apply' if type_app == 'recv' else 'team_apply_result'
            for msg in new_msgs:
                try:
                    tmp = json.loads(msg.body)
                    if tmp['type'] == type_target:
                        msg.receiver_read = True
                        msg.save()
                except Exception as e:
                    print("Exception get_notifications", e)
            return JsonResponse({'status': 'success'})
        except DatabaseError:
            return JsonResponse({'status': 'fail', 'message': 'DB Failed'})


class MessageSplitView(APIView):
    """
    기존 알림 Message를 Notification에 이동시키는 작업
    """

    def get(self, request):
        res = {}
        try:
            msg_qs = Message.objects.filter(sender=None)
            print("msg_qs", len(msg_qs))
            move_cnt, remove_cnt = 0, 0

            for i, msg in enumerate(msg_qs):
                body_json = json.loads(msg.body)
                try:
                    type_txt = body_json['type']
                    sender_name = body_json.get('subject', '')
                    body_txt = body_json['body']

                    route_id = body_json.get('team_id', None)
                    if route_id is None:
                        route_id = body_json.get('article_id', None)

                    receiver = msg.receiver
                    send_date = msg.send_date
                    receiver_read = msg.receiver_read
                    receiver_delete = msg.receiver_delete
                    with transaction.atomic():
                        noti = Notification.objects.create(type=type_txt, sender_name=sender_name,
                                                           receiver=receiver, body=body_txt, route_id=route_id,
                                                           send_date=send_date, receiver_read=receiver_read, receiver_delete=receiver_delete)
                        noti.send_date = send_date
                        noti.save()
                        move_cnt += 1

                except Exception as ex:
                    logging.exception(f"Notification create: {ex}")

            for i, msg in enumerate(msg_qs):
                msg.delete()
                remove_cnt += 1

            res = {"status": "success", "move_cnt": move_cnt,
                   "remove_cnt": remove_cnt}
        except Exception as e:
            logging.exception(f"MessageSplitView: {e}")
        return Response(res)
