import logging
from datetime import datetime

from django.db import DatabaseError, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from community.models import ArticleComment
from message.models import Notification
from team.models import TeamApplyMessage, TeamInviteMessage, TeamMember
from user.models import Account


@receiver(post_save, sender=ArticleComment)
def articlecomment_create_alert(sender, instance, created, **kwargs):
    if created:
        comment = instance
        comment_writer = comment.writer
        article_writer = comment.article.writer

        if comment_writer == article_writer:
            return
        sender_name = "익명" if comment.anonymous_writer else comment_writer.user.username

        article_title = comment.article.title
        article_title = ellipsis_text(article_title, 20)
        body = f"{article_title} 글에 {sender_name} 님이 댓글을 작성하셨습니다."
        try:
            with transaction.atomic():
                Notification.objects.create(
                    type="comment",
                    sender_name=sender_name,
                    receiver=article_writer,
                    body=body,
                    send_date=datetime.now(),
                    receiver_read=False,
                    receiver_delete=False,
                    route_id=comment.article.id
                )
        except DatabaseError as e:
            logging.exception(
                f"ArticleComment Notification Creation Error: {e}")


@receiver(post_save, sender=TeamInviteMessage)
def team_invite_create_alert(sender, instance, created, **kwargs):
    if instance.status == 0:  # 인스턴스가 새로 생성된 것
        status = "대기 중"
    elif instance.status == 1:  # 인스턴스 status 0 -> 1
        status = "승인"
    else:  # 인스턴스 status 0 -> 2
        status = "거절"

    tm_admin_li = list(TeamMember.objects.filter(
        is_admin=True, team=instance.team).values_list('member', flat=True))
    team_name = instance.team.name

    sender_name = ''
    route_id = None
    if status == "대기 중":
        # 초대하는 유저에게 메세지를 보낸다.
        noti_type = "team_invite"
        body = f"[{team_name}] 팀 초대가 있습니다."
        receiver_li = [instance.account]
        route_id = instance.team.id
    else:  # 팀원 초대 수락 또는 거절
        noti_type = "team_invite_result"
        sender_name = instance.account.user.username
        body = f"[{team_name}] {sender_name} 님이 팀 초대를 {status} 하셨습니다."
        receiver_li = list(Account.objects.filter(user__id__in=tm_admin_li))
        route_id = instance.team.id

    try:
        with transaction.atomic():
            for receiver in receiver_li:
                Notification.objects.create(
                    type=noti_type,
                    sender_name=sender_name,
                    receiver=receiver,
                    body=body,
                    send_date=datetime.now(),
                    receiver_read=False,
                    receiver_delete=False,
                    route_id=route_id
                )
    except DatabaseError as e:
        logging.exception(f"Team Notification Creation Error: {e}")


@receiver(post_save, sender=TeamApplyMessage)
def team_apply_create_alert(sender, instance, created, **kwargs):
    if instance.status == 0:  # 인스턴스가 새로 생성된 것
        status = "대기 중"
    elif instance.status == 1:  # 인스턴스 status 0 -> 1
        status = "승인"
    else:  # 인스턴스 status 0 -> 2
        status = "거절"

    tm_admin_li = list(TeamMember.objects.filter(
        is_admin=True, team=instance.team).values_list('member', flat=True))
    team_name = instance.team.name

    sender_name = ''
    route_id = None
    if status == "대기 중":
        noti_type = "team_apply"
        body = f"[{team_name}] 팀 지원 요청이 있습니다."
        # 지원한 팀의 admin권한을 가진 유저들에게 모두 메세지를 보낸다.
        receiver_li = list(Account.objects.filter(user__id__in=tm_admin_li))
        route_id = instance.team.id
    else:
        # 팀 지원 수락 또는 거절
        noti_type = "team_apply_result"
        body = f"[{team_name}] 팀 지원이 {status} 되었습니다."
        receiver_li = [instance.account]
        route_id = instance.team.id

    try:
        with transaction.atomic():
            for receiver in receiver_li:
                Notification.objects.create(
                    type=noti_type,
                    sender_name=sender_name,
                    receiver=receiver,
                    body=body,
                    send_date=datetime.now(),
                    receiver_read=False,
                    receiver_delete=False,
                    route_id=route_id
                )
    except DatabaseError as e:
        logging.exception(f"TeamApply Notification Creation Error: {e}")


def ellipsis_text(text, limit=20):
    if limit < len(text) - 3:
        return text[:limit] + "..."
    elif len(text) - 3 <= limit and limit < len(text):
        return text[:limit-3] + "..."

    return text
