from django.db.models.signals import post_save
from django.dispatch import receiver

from community.models import ArticleComment, ArticleLike
from team.models import TeamInviteMessage
from message.models import Message

from datetime import datetime, timedelta


@receiver(post_save, sender=ArticleComment)
def articlecomment_create_alert(sender, instance, created, **kwargs):
    if created:
        comment = instance
        comment_writer = comment.writer
        article_writer = comment.article.writer
        if comment_writer == article_writer:
            return

        if comment.anonymous_writer:
            body_subject = '익명'
        else:
            body_subject = comment_writer.user.username

        body = body_subject + ' 님이 댓글을 작성하셨습니다.'

        Message.objects.create(
            receiver=article_writer,body=body,send_date=datetime.now(),
            receiver_read=False,sender_delete=False,receiver_delete=False
                               )

@receiver(post_save, sender=ArticleLike)
def create_articlelike_alert(sender, instance, created, **kwargs):
    if created:
        Message.objects.create(user=instance)

@receiver(post_save, sender=TeamInviteMessage)
def create_teaminvite_alert(sender, instance, created, **kwargs):
    if created:
        Message.objects.create(user=instance)

@receiver(post_save, sender=TeamInviteMessage)
def create_teaminvite_result_alert(sender, instance, created, **kwargs):
    if created:
        Message.objects.create(user=instance)