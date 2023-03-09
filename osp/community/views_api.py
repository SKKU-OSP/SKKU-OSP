from django.http import JsonResponse
from django.template.loader import render_to_string
from django.db import DatabaseError, transaction
from django.views.decorators.csrf import csrf_exempt

from osp.settings import MEDIA_URL
from .models import *
from tag.models import Tag
from user.models import Account
from community.models import TeamRecruitArticle

from bs4 import BeautifulSoup
from datetime import datetime
import os

@csrf_exempt
def article_create(request):
    message = ''
    status = 'success'
    board_id = request.POST.get('board_id')
    board_id = int(board_id) if board_id.isdigit() else 0
    board = Board.objects.get(id=board_id)

    try:
        with transaction.atomic():

            req_body = request.POST.get('body')
            soup, parse_message = parse_req_body(req_body)

            account = Account.objects.get(user=request.user.id)
            article = Article.objects.create(title=request.POST.get('title'), body=str(soup),
                pub_date=datetime.now(), mod_date=datetime.now(),
                anonymous_writer=request.POST.get('is_anonymous') == 'true',
                is_notice=request.POST.get('is_notice') == 'true',
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
    if parse_message != '':
        message = parse_message + "\n" + message
    return JsonResponse({'status': status, 'message': message})

@csrf_exempt
def article_update(request):
    message = ''
    status = 'success'
    article_id = request.POST.get('article_id')
    article_id = int(article_id) if article_id.isdigit() else 0
    try:
        with transaction.atomic():
            article = Article.objects.get(id=article_id)
            req_body = request.POST.get('body')
            soup, parse_message = parse_req_body(req_body)

            if article.writer.user == request.user:
                target_article = Article.objects.filter(id=article_id)
                target_article.update(
                    title=request.POST.get('title'), 
                    body=str(soup), 
                    mod_date=datetime.now(), 
                    anonymous_writer=request.POST.get('is_anonymous') == 'true',
                    is_notice=request.POST.get('is_notice') == 'true'
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
    if parse_message != '':
            message = parse_message + "\n" + message
    return JsonResponse({'status': status, 'message': message})

@csrf_exempt
def article_delete(request):
    message = ''

    status = 'success'
    article_id = request.POST.get('article_id')
    article_id = int(article_id) if article_id.isdigit() else 0

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

        if article.writer.user_id == user.id:
            # 작성자가 추천한 경우
            return JsonResponse({'status': 'fail', 'message': "내가 작성한 글은 추천하실 수 없습니다."})
        
        obj, created = ArticleLike.objects.get_or_create(article=article,account=account)

        if not created:
            obj.delete()
        like_cnt = len(ArticleLike.objects.filter(article=article))
        return JsonResponse({'status': 'success', 'created': created, 'result': like_cnt, 'message':''})
    except Exception as e:
        print("article like error" , e)
        return JsonResponse({'status':'fail', 'message':'문제가 생겼습니다. 게시글에 추천할 수 없습니다.'})

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

        if comment.writer.user_id == request.user.id:
            # 작성자가 추천한 경우
            return JsonResponse({'status': 'fail', 'message': '내가 작성한 댓글은 추천하실 수 없습니다.'})

        obj, created = ArticleCommentLike.objects.get_or_create(comment=comment,account=account)
        if not created:
            obj.delete()
        like_cnt = len(ArticleCommentLike.objects.filter(comment=comment))
        return JsonResponse({'status': 'success', 'result': like_cnt, 'message':''})
    except DatabaseError as e:
        print("comment_like error", e)
        return JsonResponse({'status':'fail', 'message': '문제가 생겼습니다. 댓글에 추천하실 수 없습니다.'})

def upload_article_image(request):

    message = ''
    status = 'success'
    req_img = request.FILES.get('image', False)

    if req_img == False:
        return JsonResponse({'status': 'fail', 'message': '이미지에 문제가 있습니다.'})

    try:
        with transaction.atomic():
            article_img = ArticleImage.objects.create(image=req_img,
                                        created_user=str(request.user.username) + "_" + str(request.user.id),
                                        created_date=datetime.now(),
                                        status="UPLOAD",
                                        article_id=0)
    except Exception as e:
        status = 'fail'
        message = str(e)
        if request.user.is_anonymous:
            message = "로그인 후 이용해주세요."

    return JsonResponse({'status': status, 'message': message, 'src': os.path.join(MEDIA_URL, article_img.image.name)})

def parse_req_body(req_body):
    print("req_body", type(req_body), req_body)
    message = ''
    soup = BeautifulSoup(req_body, "lxml")
    # 위험할 수 있는 태그 지우기
    remove_tag_list = ['label', 'input', 'textarea', 'script', 'form', 'style', 'source']
    for remove_tag in remove_tag_list:
        target_tags = soup.find_all(remove_tag)
        for target in target_tags:
            target.decompose()

    img_tags = soup.find_all('img')
    for img in img_tags:
        print(img.attrs)
        if 'src' in img.attrs:
            for attr_key in img.attrs:
                if attr_key not in ['class', 'src']:
                    del img.attrs[attr_key]
        else:
            img.decompose()

    all_tags = soup.find_all()
    for tag in all_tags:
        if 'src' in tag.attrs and 'javascript:' in tag.attrs['src']:
            message = "경고: 이상 코드가 감지되었습니다."
            tag.decompose()

    return soup, message
