
from django.dispatch import receiver
from django.http import JsonResponse
from django.shortcuts import render
from django.db.models import Q, F, Max
from django.contrib.auth.decorators import login_required

from .models import Message
from user.models import Account

# Create your views here.
@login_required
def message_list_view(request):
    data = {}
    data['notification'] = []
    data['msg'] = {}
    my_acc = Account.objects.get(user=request.user)
    
    msg_opponent = {}
    # 내가 가장 마지막에 보낸 메시지의 시간
    my_last_send_date = { msg.recv: msg \
        for msg in Message.objects.filter(sender=my_acc)\
        .annotate(recv=F('receiver'), last_date=Max('send_date'))
    }
    for opponent, msg in my_last_send_date.items():
        msg_opponent[msg.receiver] = {
            'unread': 0,
            'last_msg': msg
        }
    for opponent in Message.objects.filter(receiver=my_acc).exclude(sender=None).values('sender').distinct():
        if opponent['sender'] in my_last_send_date:
            last_date = my_last_send_date[opponent['sender']].send_date
            msg_list = Message.objects.filter(
                sender=opponent['sender'], 
                receiver=my_acc, 
                receiver_read=False,
                send_date__gt=last_date
            ).order_by('-send_date')
        else:
            msg_list = Message.objects.filter(
                sender=opponent['sender'], 
                receiver=my_acc, 
                receiver_read=False,
            )
        last_msg = msg_list.first()
        oppo_acc = last_msg.receiver if last_msg.receiver != my_acc else last_msg.sender
        msg_opponent[oppo_acc] = {
            'unread': len(msg_list),
            'last_msg': last_msg
        }
    data['msg_opponent'] = msg_opponent
    return render(request, 'message/list-view.html', data)

@login_required
def message_chat_view(request, opponent):
    oppo_acc = Account.objects.get(user=opponent)
    my_acc = Account.objects.get(user=request.user)
    raw_msg_list = Message.objects.filter(
        Q(sender=oppo_acc, receiver=my_acc) | Q(sender=my_acc, receiver=oppo_acc)
    ).order_by('send_date')[:10]
    msg_list = []
    for msg in raw_msg_list:
        print(msg.sender, '->', msg.receiver, msg.body, msg.send_date)
        msg_list.append({
            'sender': str(msg.sender),
            'sender_id': msg.sender.user_id,
            'receiver': str(msg.receiver),
            'receiver_id': msg.receiver.user_id,
            'body': str(msg.body),
            'send_date': str(msg.send_date),
            'unread': str(msg.receiver_read)
        })
    return JsonResponse({'data': msg_list})

def message_send(request):
    pass