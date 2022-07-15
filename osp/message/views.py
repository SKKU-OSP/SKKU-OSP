from django.db.models import Q, F, Max
from django.shortcuts import render
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
def message_chat_view(request):
    # msg_query = (Q(receiver=my_acc) & ~Q(sender=None)) | Q(sender=my_acc)
    # msg_list = Message.objects.filter(msg_query).order_by('send_date')
    # msg_by_opponent = {}
    # for msg in msg_list:
    #     opponent = msg.sender if msg.sender != my_acc else msg.receiver
    #     if opponent not in msg_by_opponent:
    #         msg_by_opponent[opponent] = {'msgs': [], 'unread': 0}
    #     msg_by_opponent[opponent]['send_date'] = msg.send_date
    #     msg_by_opponent[opponent]['msgs'].append(msg)
    #     if not msg.receiver_read:
    #         msg_by_opponent[opponent]['unread'] += 1
    #     if msg.sender == my_acc:
    #         msg_by_opponent[opponent]['unread'] = 0
    
    # for oppo, data in msg_by_opponent.items():
    #     print(oppo, data['send_date'], data['unread'])
    #     for msg in data['msgs']:
    #         print(msg.send_date, msg.body, msg.sender, '->', msg.receiver, msg.receiver_read)
    # data['msg_opponent'] = msg_by_opponent
    pass

def message_send(request):
    pass