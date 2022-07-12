from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.db.models import Q, Count
from .models import *
from tag.models import Tag

from team.models import TeamRecruitArticle, TeamMember, Team, TeamTag
from user.models import Account
from datetime import datetime, timedelta
import hashlib
import math
from django.views.generic import TemplateView
from django.contrib.auth.models import User
from datetime import datetime
from django.db import DatabaseError, transaction
from django.views.decorators.csrf import csrf_exempt

# Create your views here.
def main(request):
    board_list = []
    team_board_query = Q()
    if request.user.is_authenticated:
        user = User.objects.get(username=request.user)
        account = Account.objects.get(user=user)
        team_list = [x.team.name for x in TeamMember.objects.filter(member=account).prefetch_related('team')]
        team_board_query = Q(name__in=team_list)
    for board in Board.objects.filter(team_board_query | ~Q(board_type='Team')):
        # 주간 Hot 게시물
        # week_ago = datetime.now() - timedelta(days=7)
        # article_list = Article.objects.filter(board_id=board,
        #                                       pub_date__range=[
        #                                           week_ago.strftime('%Y-%m-%d %H:%M:%S-09:00'),
        #                                           datetime.now().strftime('%Y-%m-%d %H:%M:%S-09:00')
        #                                       ]
        #                                       )
        # if len(article_list) > 0:
        #     article_list = article_list.order_by('-view_cnt')
        #     board.article_list = article_list[:min(3, len(article_list))]
        # else:
        #     board.article_list = []
        # 최신 게시물
        article_list = Article.objects.filter(board_id=board).order_by('-pub_date')
        board.article_list = article_list[:min(3, len(article_list))]
        for article in board.article_list:
            article.tags = [art_tag.tag for art_tag in ArticleTag.objects.filter(article=article)]
            article.like_cnt = len(ArticleLike.objects.filter(article=article))
            article.comment_cnt = len(ArticleComment.objects.filter(article=article))
        board.board_color = hashlib.md5(board.name.encode()).hexdigest()[:6]
        board_list.append(board)
    return render(request, 'community/main.html', {'boards': board_list})

def board(request, board_name):
    try:
        board = Board.objects.get(name=board_name)
    except Board.DoesNotExist:
        return redirect('/community')
    board_color = hashlib.md5(board.name.encode()).hexdigest()[:6]
    context = {'board': board, 'board_color': board_color}
    if board.board_type == 'Recruit':
        active_article = Article.objects.filter(board_id=board)
        active_article = active_article.filter(period_end__gte=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        for article in active_article:
            article.tags = [art_tag.tag for art_tag in ArticleTag.objects.filter(article=article)]
            article.team = TeamRecruitArticle.objects.get(article=article).team
        context['active_article'] = active_article
        context['active_article_tab'] = range(math.ceil(len(active_article) / 4))
    if board.board_type == 'Team':
        team = Team.objects.get(name=board.name)
        team_tags = TeamTag.objects.filter(team=team)
        team_members = TeamMember.objects.filter(team=team)
        my_acc = Account.objects.get(user=request.user)
        context['team_admin'] = team_members.get(member=my_acc).is_admin
        context['team'] = team
        context['team_tags'] = team_tags
        context['team_members'] = team_members
        context['team_admin']
    return render(request, 'community/board/board.html', context)

def article_list(request, board_name):
    try:
        board = Board.objects.get(name=board_name)
    except Board.DoesNotExist:
        result = {'html': '', 'max-page': 0}
        return JsonResponse(result)
    if board.board_type == 'Recruit':
        PAGE_SIZE = 5
    elif board.board_type == 'QnA':
        PAGE_SIZE = 7
    else:
        PAGE_SIZE = 10
    context = {}
    board.board_color = hashlib.md5(board.name.encode()).hexdigest()[:6]
    context['board'] = board
    context['bartype'] = 'normal'
    
    sort_field = request.GET.get('sort', ('-pub_date', 'title', 'id'))
    
    page = int(request.GET.get('page', 1))
    # Filter Board
    article_list = Article.objects.filter(board_id=board)
    # Filter Keyword
    keyword = request.GET.get('keyword', '')
    if keyword != '':
        article_list = article_list.filter(Q(title__icontains=keyword)|Q(body__icontains=keyword))
        print(keyword, type(keyword),article_list)
    # Filter Tag
    tag_list = request.GET.get('tag', False)
    if tag_list:
        tag_list = tag_list.split(',')
        tag_query = Q()
        for tag in tag_list:
            tag_query = tag_query | Q(tag=tag)
        article_with_tag = ArticleTag.objects.filter(tag_query).values('article')
        article_list = article_list.filter(id__in=article_with_tag)
    
    total_len = len(article_list)
    # Order
    article_list = article_list.order_by(*sort_field)
    # Slice to Page
    article_list = article_list[PAGE_SIZE * (page - 1):]
    article_list = article_list[:PAGE_SIZE]
    # Get Article Metadata
    for article in article_list:
        comment_cnt = len(ArticleComment.objects.filter(article=article))
        like_cnt = len(ArticleLike.objects.filter(article=article))
        tags = [art_tag.tag for art_tag in ArticleTag.objects.filter(article=article)]
        article.comment_cnt = comment_cnt
        article.like_cnt = like_cnt
        article.tags = tags
        if board.board_type == 'Team':
            article.team = TeamRecruitArticle.objects.get(article=article).team
        if board.board_type == 'QnA':
            comment_by_like = ArticleCommentLike.objects.filter(comment__in=\
                ArticleComment.objects.filter(article=article).values('id'))\
                .annotate(like_cnt=Count('comment')).order_by('-like_cnt')
            if len(comment_by_like):
                article.comment = comment_by_like[0]
    if board.board_type == 'QnA':
        context['comment_visible'] = True
    context['article_list'] = article_list
    result = {}
    result['html'] = render_to_string('community/article-bar.html', context)
    result['max-page'] = math.ceil(total_len / PAGE_SIZE)
    return JsonResponse(result)


class ArticleRegisterView(TemplateView):

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)

        context['type'] = 'register'
        board_name = kwargs.get('board_name')
        try:
            context['board'] = Board.objects.get(name=board_name)
        except:
            return redirect('community:Community-Main')

        return render(request, 'community/article/article.html', context)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context



class ArticleView(TemplateView):

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        context['type'] = 'view'
        article_id = kwargs.get('article_id')
        try:
            context['article'] = Article.objects.get(id=article_id)
            context['tags'] = ArticleTag.objects.filter(article__id=article_id)
            context['board'] = Board.objects.get(id=context['article'].board_id_id)
            context['comments'] = ArticleComment.objects.filter(article_id=article_id)
            if context['board'].name == 'Team':
                teamrecruit = TeamRecruitArticle.objects.filter(article=context['article']).first()
                if teamrecruit:
                    context['team'] = Team.objects.filter(id=teamrecruit.team.id).first()
        except:
            return redirect('community:Community-Main')
        context['article'].view_cnt += 1
        context['article'].save()

        return render(request, 'community/article/article.html', context)

    def post(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        context['type'] = 'edit'
        article_id = kwargs.get('article_id')
        context['article'] = Article.objects.get(id=article_id)
        context['tags'] = ArticleTag.objects.filter(article__id=article_id)

        context['board'] = Board.objects.get(id=context['article'].board_id.id)
        if context['board'].name == 'Team':
            teamrecruit = TeamRecruitArticle.objects.filter(article=context['article']).first()
            if teamrecruit:
                context['team'] = Team.objects.filter(id=teamrecruit.team.id).first()

        result = {}
        result['html'] = render_to_string('community/article/includes/content-edit.html', context)
        result['tags'] = list(context['tags'].values_list('tag__name', flat=True))

        return JsonResponse(result)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

@csrf_exempt
def article_create(request):
    message = ''

    status = 'success'
    board_name = request.POST.get('board_name')
    board = Board.objects.get(name=board_name)

    try:
        with transaction.atomic():
            account = Account.objects.get(user=request.user)
            article = Article.objects.create(title=request.POST.get('title'), body=request.POST.get('body'),
                                             pub_date=datetime.now(), mod_date=datetime.now(),
                                             anonymous_writer=request.POST.get('is_anonymous') == 'true',
                                             board_id_id=board.id,
                                             writer=account)
            tag_list = request.POST.get('tags').split(',')
            for tag_name in tag_list:
                if tag_name:
                    tag = Tag.objects.get(name=tag_name)
                    ArticleTag.objects.create(article=article, tag=tag)
            if board.name == 'Team':
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
    board_name = request.POST.get('board_name')
    article_id = request.POST.get('article_id')
    board = Board.objects.get(name=board_name)
    try:
        with transaction.atomic():
            article = Article.objects.get(id=article_id)

            if article.writer.user == request.user:
                Article.objects.filter(id=article_id).update(title=request.POST.get('title'), body=request.POST.get('body'), mod_date=datetime.now(), anonymous_writer=request.POST.get('is_anonymous') == 'true')
                tag_list = request.POST.get('tags').split(',')
                tag_list_old = list(ArticleTag.objects.filter(article=article).values_list('tag__name', flat=True))
                for tag_name in list(set(tag_list_old)-set(tag_list)):
                    ArticleTag.objects.get(article=article, tag__name=tag_name).delete()
                for tag_name in list(set(tag_list)-set(tag_list_old)):
                    tag = Tag.objects.get(name=tag_name)
                    ArticleTag.objects.create(article=article, tag=tag)
            else:
                status = 'fail'
                message = '작성자만 수정할 수 있습니다.'
    except:
        status = 'fail'

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

    except:
        status = 'fail'

    return JsonResponse({'status': status, 'message': message})

@csrf_exempt
def comment_create(request):

    message = ''

    status = 'success'
    article_id = request.POST.get('article_id')
    try:
        with transaction.atomic():
            writer = Account.objects.get(user=request.user)
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
    print('hihibye')
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
        html = render_to_string('community/article/includes/comments.html',context)
    return JsonResponse({'status': status, 'message': message, 'html':html})