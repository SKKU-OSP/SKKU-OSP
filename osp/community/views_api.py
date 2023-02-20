from django.http import JsonResponse
from django.template.loader import render_to_string
from django.db import DatabaseError, transaction
from django.views.decorators.csrf import csrf_exempt

from .models import *
from tag.models import Tag
from user.models import Account
from community.models import TeamRecruitArticle

from datetime import datetime


@csrf_exempt
def article_create(request):
    message = ''

    status = 'success'
    board_id = request.POST.get('board_id')
    board = Board.objects.get(id=board_id)

    try:
        with transaction.atomic():

            account = Account.objects.get(user=request.user.id)
            article = Article.objects.create(title=request.POST.get('title'), body=request.POST.get('body'),
                pub_date=datetime.now(), mod_date=datetime.now(),
                anonymous_writer=request.POST.get('is_anonymous') == 'true',
                board_id=board.id,
                writer=account)
            if request.POST.get('period_start', False):
                article.period_start = request.POST.get('period_start')[:-1]
                article.period_end = request.POST.get('period_end')[:-1]
                article.save()
            tag_list = request.POST.get('tags').split(',')
            for tag_name in tag_list:
                if tag_name:
                    tag = Tag.objects.get(name=tag_name)
                    ArticleTag.objects.create(article=article, tag=tag)
            if board.board_type == 'Recruit':
                team = Team.objects.get(id=request.POST.get('team_id'))
                TeamRecruitArticle.objects.create(team=team,article=article)

    except Exception as e:
            status = 'fail'
            message = str(e)
            if request.user.is_anonymous:
                message = "로그인 후 이용해주세요."
            # message = str(e) + "\n" + str(trace_back)

    return JsonResponse({'status': status, 'message': message})

@csrf_exempt
def article_update(request):
    message = ''
    status = 'success'
    article_id = request.POST.get('article_id')
    try:
        with transaction.atomic():
            article = Article.objects.get(id=article_id)

            if article.writer.user == request.user:
                target_article = Article.objects.filter(id=article_id)
                target_article.update(
                    title=request.POST.get('title'), 
                    body=request.POST.get('body'), 
                    mod_date=datetime.now(), 
                    anonymous_writer=request.POST.get('is_anonymous') == 'true'
                )
                if request.POST.get('period_start', False):
                    target_article.update(
                        period_start=request.POST.get('period_start')[:-1],
                        period_end=request.POST.get('period_end')[:-1]
                    )
                tag_list = request.POST.get('tags').split(',')
                tag_list_old = list(ArticleTag.objects.filter(article=article).values_list('tag__name', flat=True))

                for tag in tag_list:
                    if not tag:
                        tag_list = []
                        break
                for tag_name in list(set(tag_list_old)-set(tag_list)):
                    ArticleTag.objects.get(article=article, tag__name=tag_name).delete()
                for tag_name in list(set(tag_list)-set(tag_list_old)):
                    tag = Tag.objects.get(name=tag_name)
                    ArticleTag.objects.create(article=article, tag=tag)
            else:
                status = 'fail'
                message = '작성자만 수정할 수 있습니다.'

    except DatabaseError:
        status = 'fail'
        message = 'Internal Database Error'

    return JsonResponse({'status': status, 'message': message})

@csrf_exempt
def article_delete(request):
    message = ''

    status = 'success'
    article_id = request.POST.get('article_id')

    try:
        with transaction.atomic():

            article = Article.objects.get(id=article_id)
            #cascade 달려있음.

            if article.writer.user == request.user:
                article.delete()

            else:
                status = 'fail'
                message = '작성자만 삭제할 수 있습니다.'


    except Exception as e:
        status = 'fail'
        message = str(e)
        if request.user.is_anonymous:
            message = "로그인 후 이용해주세요."

    return JsonResponse({'status': status, 'message': message})


def article_like(request):
    try:
        article_id = request.POST.get('article_id')
        user = request.user
        article = Article.objects.get(id=article_id)
        account = Account.objects.get(user=user)

        obj, created = ArticleLike.objects.get_or_create(article=article,account=account)

        if not created:
            obj.delete()
        like_cnt = len(ArticleLike.objects.filter(article=article))
        return JsonResponse({'status': 'success', 'created': created, 'result': like_cnt})
    except:
        return JsonResponse({'status':'false'})

def article_scrap(request):
    try:
        article_id = request.POST.get('article_id')
        user = request.user
        article = Article.objects.get(id=article_id)
        account = Account.objects.get(user=user)
        obj, created = ArticleScrap.objects.get_or_create(article=article,account=account)
        if not created:
            obj.delete()
        scrap_cnt = len(ArticleScrap.objects.filter(article=article))
        return JsonResponse({'status': 'success', 'created': created, 'result': scrap_cnt})
    except DatabaseError:
        return JsonResponse({'status':'false'})
    
    
@csrf_exempt
def comment_create(request):

    message = ''

    status = 'success'
    article_id = request.POST.get('article_id')
    try:
        with transaction.atomic():
            writer = Account.objects.get(user=request.user.id)
            article = Article.objects.get(id=article_id)
            comment = ArticleComment.objects.create(article=article,body=request.POST.get('body'),pub_date=datetime.now(),del_date=datetime.now(),anonymous_writer=request.POST.get('is_anonymous') == 'true',writer=writer)
    except Exception as e:
            status = 'fail'
            message = str(e)
            if request.user.is_anonymous:
                message = "로그인 후 이용해주세요."

    html = ''
    if status == 'success':
        comments = ArticleComment.objects.filter(article=article)
        context = {'article':article, 'comments':comments}
        html = render_to_string('community/article/includes/comments.html',context, request=request)

    return JsonResponse({'status': status, 'message': message, 'html':html})

@csrf_exempt
def comment_delete(request):
    message = ''

    status = 'success'
    comment_id = request.POST.get('comment_id')

    try:
        with transaction.atomic():
            comment_f = ArticleComment.objects.filter(id=comment_id)
            comment_f.update(del_date=datetime.now(),is_deleted=True)
            comment = comment_f.get()
            article = Article.objects.get(id=comment.article.id)
            if comment.writer.user == request.user:
                comment.delete()
            else:
                status = 'fail'
                message = '작성자만 삭제할 수 있습니다.'
    except:
        status = 'fail'

    html = ''
    if status == 'success':
        comments = ArticleComment.objects.filter(article=article)
        context = {'article':article, 'comments':comments}
        html = render_to_string('community/article/includes/comments.html',context,request=request)
    return JsonResponse({'status': status, 'message': message, 'html':html})

def comment_like(request):
    try:
        comment_id = request.POST.get('comment_id')
        comment = ArticleComment.objects.get(id=comment_id)
        account = Account.objects.get(user=request.user.id)
        obj, created = ArticleCommentLike.objects.get_or_create(comment=comment,account=account)
        if not created:
            obj.delete()
        like_cnt = len(ArticleCommentLike.objects.filter(comment=comment))
        return JsonResponse({'status': 'success', 'result': like_cnt})
    except DatabaseError as e:
        return JsonResponse({'status':'fail', 'message': str(e)})
