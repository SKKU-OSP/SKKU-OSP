from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.db.models import Q, Count
from .models import *
from team.models import TeamRecruitArticle, TeamMember, Team
from user.models import Account
from datetime import datetime, timedelta
import hashlib
import math

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
    if board.board_type == 'QnA':
        return render(request, 'community/qna-board.html', context)
    if board.board_type == 'Recruit':
        active_article = Article.objects.filter(board_id=board)
        active_article = active_article.filter(period_end__gte=datetime.now().strftime('%Y-%m-%d %H:%M:%S-09:00'))
        for article in active_article:
            article.tags = [art_tag.tag for art_tag in ArticleTag.objects.filter(article=article)]
            article.team = TeamRecruitArticle.objects.get(article=article).team
        context['active_article'] = active_article
        context['active_article_tab'] = range(math.ceil(len(active_article) / 4))
        return render(request, 'community/recruit-board.html', context)
    
    return render(request, 'community/board.html', context)

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
    
    sort_field = request.GET.get('sort', ('-pub_date', 'title'))
    
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