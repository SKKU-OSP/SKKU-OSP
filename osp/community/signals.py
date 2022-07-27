from django.db.models.signals import post_save
from django.dispatch import receiver

from community.models import ArticleComment, ArticleLike
from team.models import TeamInviteMessage, TeamMember
from message.models import Message
from django.db import transaction, DatabaseError
from user.models import Account
from datetime import datetime, timedelta
import json

@receiver(post_save, sender=ArticleComment)
def articlecomment_create_alert(sender, instance, created, **kwargs):
    if created:
        comment = instance
        comment_writer = comment.writer
        article_writer = comment.article.writer
        if comment_writer == article_writer:
            return

        body_dict = {}

        if comment.anonymous_writer:
            body_subject = "익명"
        else:
            body_subject = comment_writer.user.username

        body_dict["subject"] = body_subject + ""
        body_dict["type"] = "comment"
        body_dict["body"] = body_subject + " 님이 댓글을 작성하셨습니다."
        body_dict["article_id"] = "" + str(comment.article.id)
        body = json.dumps(body_dict)
        # body = str(body_dict)
        Message.objects.create(
            receiver=article_writer,body=body,send_date=datetime.now(),
            receiver_read=False,sender_delete=False,receiver_delete=False
                               )

@receiver(post_save, sender=ArticleLike)
def articlelike_create_alert(sender, instance, created, **kwargs):
    if created:
        articlelike = instance
        article = articlelike.article
        like_account = articlelike.account
        article_writer = article.writer
        if like_account == article_writer:
            return

        body_dict = {}
        body_dict["type"] = "articlelike"
        body_dict["body"] = "게시글에 공감을 받았습니다."
        body_dict["article_id"] = "" + str(article.id)
        body = json.dumps(body_dict)

        Message.objects.create(
            receiver=article_writer, body=body, send_date=datetime.now(),
            receiver_read=False, sender_delete=False, receiver_delete=False
        )

@receiver(post_save, sender=TeamInviteMessage)
def teaminvite_create_alert(sender, instance, created, **kwargs):

    if instance.status  == 0: # 인스턴스가 새로 생성된 것
        status = "대기중"
    elif instance.status  == 1: # 인스턴스 status 0 -> 1
        status = "승인"
    else: # 인스턴스 status 0 -> 2
        status = "거절"
    if instance.direction:
        direction = "팀원 초대"
    else:
        direction = "팀 지원"

        print("ssssssssss")
        tm_admin_li = list(TeamMember.objects.filter(is_admin=True, team=instance.team).values_list('member', flat=True))
        body_subject = instance.team.name
        if direction=="팀 지원" and status=="대기중":
            print("ssssss")
            # 지원한 팀의 admin권한을 가진 유저들에게 모두 메세지를 보낸다.
            body_dict = {"type": "team_apply", "body": "[" + body_subject + "]" + "팀 지원 요청이 있습니다."}
            body = json.dumps(body_dict)
            for tm_admin in tm_admin_li:
                print(tm_admin)
                account = Account.objects.get(user__id=tm_admin)
                Message.objects.create(
                    receiver=account, body=body, send_date=datetime.now(),
                    receiver_read=False, sender_delete=False, receiver_delete=False
                )
        elif direction=="팀 지원": # 팀 지원 수락 또는 거절
            print("ssssss")
            body_dict = {"type": "team_apply_result",
                         "body": "[" + body_subject + "]" + "팀 지원이 " + status + "되었습니다."}
            body = json.dumps(body_dict)
            Message.objects.create(
                receiver=instance.account, body=body, send_date=datetime.now(),
                receiver_read=False, sender_delete=False, receiver_delete=False
            )

        elif direction=="팀원 초대" and status=="대기중":
            print("sssss1111111s")
            # 초대하는 유저에게 메세지를 보낸다.
            body_dict = {"type": "team_invite", "body": "[" + body_subject + "]" + "팀 초대가 있습니다."}
            body = json.dumps(body_dict)
            Message.objects.create(
                receiver=instance.account, body=body, send_date=datetime.now(),
                receiver_read=False, sender_delete=False, receiver_delete=False
            )
        else: # 팀원 초대 수락 또는 거절
            print("ss12222222sss")
            tmp = "[" + body_subject + "]"
            tmp += " " + instance.account.user.username + "님이 "
            tmp += "팀 초대를 " + status + "하셨습니다."
            body_dict = {"type": "team_invite_result", "body": tmp}
            body = json.dumps(body_dict)
            for tm_admin in tm_admin_li:
                Message.objects.create(
                    receiver__id=tm_admin, body=body, send_date=datetime.now(),
                    receiver_read=False, sender_delete=False, receiver_delete=False
                )

# @receiver(post_save, sender=TeamInviteMessage)
# def create_teaminvite_result_alert(sender, instance, created, **kwargs):
#     if created:
#         Message.objects.create(user=instance)