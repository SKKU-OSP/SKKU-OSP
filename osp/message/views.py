from django.db import DatabaseError, transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.db.models import Q, Max
from django.contrib.auth.decorators import login_required

from datetime import datetime

from .models import Message
from user.models import Account

# Create your views here.
@login_required
def message_list_view(request, selected_oppo):
    data = {}
    data['notification'] = []
    data['msg'] = {}
    my_acc = Account.objects.get(user=request.user)

    selected_opponent = None
    if selected_oppo!=0:
        selected_opponent = Account.objects.get(user__id=selected_oppo)
    
    msg_opponent = {}
    # 내가 가장 마지막에 보낸 메시지의 시간
    my_last_send_date = { msg.receiver: msg \
        for msg in Message.objects.filter(sender=my_acc)\
        .annotate(last_date=Max('send_date'))
    }
    for opponent, msg in my_last_send_date.items():
        msg_opponent[msg.receiver] = {
            'unread': 0,
            'last_msg': msg
        }
    for last_msg in Message.objects.filter(receiver=my_acc).exclude(sender=None).distinct():
        opponent = last_msg.sender
        if opponent in my_last_send_date:
            last_date = my_last_send_date[opponent].send_date
            msg_list = Message.objects.filter(
                sender=opponent, 
                receiver=my_acc, 
                receiver_read=False,
                send_date__gt=last_date
            ).order_by('-send_date')
        else:
            msg_list = Message.objects.filter(
                sender=opponent, 
                receiver=my_acc, 
                receiver_read=False,
            )
        msg_opponent[opponent] = {'unread': len(msg_list) }
    data['msg_opponent'] = msg_opponent
    if selected_opponent in msg_opponent or not selected_opponent:
        data['selected_new_opponent'] = None
    else:
        data['selected_new_opponent'] = selected_opponent


    return render(request, 'message/list-view.html', data)

@login_required
def message_chat_view(request, opponent):
    oppo_acc = Account.objects.get(user=opponent)
    my_acc = Account.objects.get(user=request.user)
    if request.method == 'GET':
        last_date = request.GET.get('oldest', datetime.now())
        raw_msg_list = Message.objects.filter(
            (Q(sender=oppo_acc, receiver=my_acc) | Q(sender=my_acc, receiver=oppo_acc)) \
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
        # TODO: 신규 메시지 생성시 기존메시지 <-> 신규 메시지 사이에 수신한 메시지도 조회
        # raw_msg_list = Message.objects.filter(
        #     (Q(sender=oppo_acc, receiver=my_acc) | Q(sender=my_acc, receiver=oppo_acc)) \
        #     & Q(send_date__gt=last_date) & Q(send_date__lt=new_msg.send_date)
        # ).order_by('-send_date')[:10]
        # for msg in raw_msg_list:
        #     if msg.receiver == my_acc and msg.receiver_read == False:
        #         msg.receiver_read = True
        #         msg.save()
        #     msg_list.append({
        #         'id': msg.id,
        #         'sender': str(msg.sender),
        #         'sender_id': msg.sender.user_id,
        #         'receiver': str(msg.receiver),
        #         'receiver_id': msg.receiver.user_id,
        #         'body': str(msg.body),
        #         'send_date': str(msg.send_date),
        #         'read': str(msg.receiver_read)
        #     })
        return JsonResponse({'status': 'success', 'msg_id': new_msg.id, 'new_msg_list':msg_list})
