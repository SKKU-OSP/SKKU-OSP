from django.http import JsonResponse, Http404
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.contrib.auth.decorators import login_required
from django.db import DatabaseError, transaction
from django.db.models import F, Q, Count
from django.views.decorators.csrf import csrf_exempt

from .models import *
from tag.models import Tag
from team.models import TeamMember, Team, TeamTag, TeamInviteMessage
from user.models import Account, AccountInterest, AccountPrivacy
from community.models import TeamRecruitArticle
from team.recommend import get_team_recommendation_list

import hashlib
import math, json, time
from django.views.generic import TemplateView
from datetime import datetime, timedelta

# Create your views here.

class CommunityMainView(TemplateView):
    def get(self, request, *args, **kwargs):
        board_list = []
        team_board_query = Q()
        if request.user.is_authenticated:
            account = Account.objects.get(user=request.user)
            team_list = [x.team.name for x in TeamMember.objects.filter(member=account).prefetch_related('team')]
            team_board_query = Q(name__in=team_list)
        boards = Board.objects.exclude(board_type='User').exclude(board_type='Team')

        for board in boards:
        # for board in Board.objects.filter(team_board_query | ~Q(board_type='Team')):
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
            article_list = Article.objects.filter(board_id=board).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
            board.article_list = article_list[:min(8, len(article_list))]
            
            board.article_list = get_article_metas(board.article_list)
            
            if board.board_type == 'Recruit':
                for article in board.article_list:
                    tr = TeamRecruitArticle.objects.filter(article=article).first()
                    if tr:
                        article.team = tr.team
                    else:
                        article.team = None


            board.board_color = hashlib.md5(board.name.encode()).hexdigest()[:6]
            board_list.append(board)

        return render(request, 'community/main.html', {'boards': board_list})




def main(request):
    board_list = []
    team_board_query = Q()
    if request.user.is_authenticated:
        account = Account.objects.get(user=request.user)
        team_list = [x.team.name for x in TeamMember.objects.filter(member=account).prefetch_related('team')]
        team_board_query = Q(name__in=team_list)
    boards = Board.objects.filter(team_board_query | Q(team_id=None)).exclude(board_type='User')

    for board in boards:
    # for board in Board.objects.filter(team_board_query | ~Q(board_type='Team')):
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
        article_list = Article.objects.filter(board_id=board).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
        board.article_list = article_list[:min(3, len(article_list))]
        
        board.article_list = get_article_metas(board.article_list)
        
        if board.board_type == 'Recruit':
            for article in board.article_list:
                tr = TeamRecruitArticle.objects.filter(article=article).first()
                if tr:
                    article.team = tr.team
                else:
                    article.team = None


        board.board_color = hashlib.md5(board.name.encode()).hexdigest()[:6]
        board_list.append(board)
    return render(request, 'community/main.html', {'boards': board_list})


class TableBoardView(TemplateView):

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        board_name = context["board_name"]
        board_id = context["board_id"]
        context["need_login"] = False
        context["need_member"] = False
        try:
            board = Board.objects.get(id=board_id, name=board_name)
            context["board"] = board

        except Board.DoesNotExist:
            raise Http404("게시판을 찾을 수 없습니다.")
        
        # 로그인된 정보공개 설정을 확인한다.
        if request.user.is_authenticated:
            account = Account.objects.get(user_id=request.user.id)
            
            try:
                acc_pp = AccountPrivacy.objects.get(account=account)
            except:
                acc_pp = AccountPrivacy.objects.create(account=account, open_lvl=0, is_write=False, is_open=False)
            context['is_write'] = acc_pp.is_write
            context['is_open'] = acc_pp.is_open
        else:
            account = None
            context['is_write'] = 0
            context['is_open'] = 0
        
        # 게시판 별로 다른 데이터를 전달한다.
        if board.board_type == 'User':
            return redirect("/community/recommender/user/")

        if board.board_type == 'Team':
            if not request.user.is_authenticated:
                context["need_login"] = True
                return render(request, 'community/tableBoard/table-board.html', context)

            # 팀 소속일 경우 팀 게시판 로드
            # 팀에 초대받은 상태일 경우 메시지와 invited_user True 전달해 표시
            # 그외의 경우 커뮤니티 메인페이지로 리다이렉트
            context['waitedInviteMsg'] = TeamInviteMessage.objects.filter(team__id=board.team_id, account__user=request.user, direction=True, status=0)
            if TeamMember.objects.filter(team=board.team_id, member_id=request.user.id).exists():
                # 팀 멤버라면 초대 상태 리셋
                context['invited_user'] = False
            elif context['waitedInviteMsg'].exists():
                # 초대 상태로 설정
                context['invited_user'] = True
            else :
                # 팀 멤버도 아니고 초대 받지 않았다면 열람 불가
                context["need_member"] = True
                return render(request, 'community/tableBoard/table-board.html', context)
        
            team = board.team
            team_tags = TeamTag.objects.filter(team=team).values('team', 'tag__name', 'tag__type')
            team_tags_list= []
            try:
                for atg in team_tags:
                    team_tags_list.append({'name':atg["tag__name"], 'type':atg["tag__type"]})
            except Exception as e:
                print("error in team tag", e)
            
            team_members = TeamMember.objects.filter(team=team).order_by('-is_admin').prefetch_related('member__user')

            # 검색한 팀 멤버에서 유저 검색
            tm = team_members.filter(member=account).first()
            if tm:
                context['team_admin'] = tm.is_admin
            context['team'] = team
            context['team_tags'] = team_tags_list
            context['team_members'] = team_members

        
        if board.board_type == 'Recruit':

            active_article = Article.objects.filter(board_id=board, period_end__gte=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            for article in active_article:
                article.tags = [art_tag.tag for art_tag in ArticleTag.objects.filter(article=article)]
                teamrecruitarticle = TeamRecruitArticle.objects.filter(article=article).first()
                if teamrecruitarticle:
                    article.team = teamrecruitarticle.team
                else:
                    article.team = None

            team_cnt = len(TeamMember.objects.filter(member=account).prefetch_related('team'))
            context['team_cnt'] = team_cnt
            context['active_article'] = active_article
            context['active_article_tab'] = range(math.ceil(len(active_article) / 4))

        return render(request, 'community/tableBoard/table-board.html', context)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context
        

def user_board(request):
    try:
        board = Board.objects.get(name="User")
    except Board.DoesNotExist:
        return Http404("유저 추천 게시판이 없습니다.")
    context = {'board': board}

    return render(request, 'community/board/user-board.html', context)

def account_cards(request):

    start = time.time()
    PAGE_SIZE = 9
    
    result = {}
    result['max-page'] = 1
    context = {}
    context['board'] = Board.objects.get(board_type="User")
    context['account_list'] = []
    context['is_open'] = 0

    is_show = True
    try:
        acc_pp = AccountPrivacy.objects.get(account=request.user.id)
        context['is_open'] = acc_pp.is_open
        if not acc_pp.is_open:
            is_show = False
    except Exception as e:
        print("community view account_cards error: ", e)
        is_show = False
    
    if not is_show:
        result['html'] = render_to_string('community/account-card.html', context, request=request)
        return JsonResponse(result)

    # sort_field = request.GET.get('sort', ('-pub_date', 'title', 'id'))

    page = int(request.GET.get('page', 1))
    # Filter Board
    open_acc = AccountPrivacy.objects.filter(is_open=True).exclude(account=request.user.id).values('account_id')
    print("open_acc", len(open_acc))

    account_list = Account.objects.filter(user__is_superuser=False, user__id__in=open_acc)
    # Filter Keyword
    keyword = request.GET.get('keyword', '')

    team_li = json.loads(request.GET.get('team_li'))
    if request.user.is_anonymous:
        team_li = []
    elif team_li==['first']:
        team_li = list(TeamMember.objects.filter(member__user=request.user).values_list("team_id", flat=True))


    if keyword != '':
        account_list = account_list.filter(Q(user__username__icontains=keyword) | Q(introduction__icontains=keyword))
        print(keyword, type(keyword), account_list)
    # Filter Tag
    tag_list = request.GET.get('tag', False)
    if tag_list:
        tag_list = tag_list.split(',')
        tag_query = Q()
        for tag in tag_list:
            tag_query = tag_query | Q(tag=tag)
        article_with_tag = AccountInterest.objects.filter(tag_query).values('account__user')
        account_list = account_list.filter(user__in=article_with_tag)

    user_list = []
    member_id = []
    print(team_li)

    team_list = Team.objects.filter(id__in=team_li)
    print(team_list)

    # team_list를 받아서 추천하는 팀과 유저의 Account의 리스트를 검색
    team_member_dict = get_team_recommendation_list(team_list)
    for team_obj in team_list:
        if team_obj.id in team_member_dict:
            member_li = team_member_dict[team_obj.id]
            member_id += member_li
            tmps = account_list.filter(user__in=member_li)
            for tmp in tmps:
                tmp.recommend_team = team_obj
            user_list += list(tmps)

    user_list += list(account_list.exclude(user__in=member_id))

    account_list = user_list
    total_len = len(account_list)
    # Order
    # article_list = article_list.order_by(*sort_field)
    # Slice to Page
    account_list = account_list[PAGE_SIZE * (page - 1):]
    account_list = account_list[:PAGE_SIZE]
    context['account_list'] = account_list

    result = {}
    result['html'] = render_to_string('community/account-card.html', context, request=request)
    result['max-page'] = math.ceil(total_len / PAGE_SIZE)
    print("elapsed time account_cards", time.time() - start)

    return JsonResponse(result)


def article_list(request, board_name, board_id):
    try:
        board = Board.objects.get(id=board_id)
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
    article_list = Article.objects.filter(board_id=board).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
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
    article_list = list(article_list[PAGE_SIZE * (page - 1):PAGE_SIZE * (page)])

    # print(article_list)
    
    # Get Article Metadata
    article_list = get_article_metas(article_list)
    
    if board.board_type == 'Recruit':
        for article in article_list:
            tr = TeamRecruitArticle.objects.filter(article=article).first()
            if tr:
                article.team = tr.team
            else:
                article.team = None

    if board.board_type == 'QnA':
        context['comment_visible'] = True
        for article in article_list:
            comment_by_like = ArticleComment.objects.filter(
                article=article
            ).prefetch_related('articlecommentlike_set')
            comment_by_like = comment_by_like.annotate(like_cnt=Count('articlecommentlike')).order_by('-like_cnt')
            if len(comment_by_like):
                article.comment = comment_by_like[0]
    context['article_list'] = article_list
    result = {}
    result['html'] = render_to_string('community/article-table.html', context,request=request)
    result['max-page'] = math.ceil(total_len / PAGE_SIZE)

    return JsonResponse(result)


class ArticleSaveView(TemplateView):
    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        board_name = context["board_name"]
        board_id = context["board_id"]
        if request.user.is_anonymous:
            context["alert"] = "로그인이 필요한 서비스입니다."
            context["url"] = f"/community/board/{board_name}/{board_id}/"
            return render(request, "community/redirect.html", context)
        # 쿼리스트링의 값을 가져온다.
        if 'team_id' in request.GET:
            team_id = request.GET['team_id']
            members = TeamMember.objects.filter(team_id=team_id).values_list("member_id", flat=True)
            if request.user.id in members:
                context['team'] = Team.objects.get(id=team_id)

        context['type'] = 'register'
        context['type_kr'] = '등록'
        context['anonymous_check'] = 'checked'
        board_name = kwargs.get('board_name')
        board_id = kwargs.get('board_id')
        try:
            context['board'] = Board.objects.get(id=board_id)
        except:
            return redirect('community:Community-Main')

        return render(request, 'community/article/article.html', context)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context



class ArticleView(TemplateView):

    @csrf_exempt
    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        context['type'] = 'view'
        article_id = kwargs.get('article_id')
        try:
            context['article'] = Article.objects.get(id=article_id)
            context['tags'] = ArticleTag.objects.filter(article__id=article_id)
            context['board'] = Board.objects.get(id=context['article'].board_id_id)
            context['comments'] = ArticleComment.objects.filter(article_id=article_id)
            if context['board'].board_type == 'Recruit':
                teamrecruit = TeamRecruitArticle.objects.filter(article=context['article']).first()
                if teamrecruit:
                    context['article'].team = teamrecruit.team
            context['article'].view_cnt += 1
            context['article'].save()
        except:
            context['error_occur'] = True


        return render(request, 'community/article/article.html', context)

    def post(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        context['type'] = 'edit'
        context['type_kr'] = '수정'
        
        article_id = kwargs.get('article_id')
        context['article'] = Article.objects.get(id=article_id)
        context['tags'] = ArticleTag.objects.filter(article__id=article_id)

        context['board'] = Board.objects.get(id=context['article'].board_id.id)
        if context['board'].board_type == 'Recruit':
            teamrecruit = TeamRecruitArticle.objects.filter(article=context['article']).first()
            if teamrecruit:
                context['article'].team = teamrecruit.team
        context['anonymous_check'] = "checked" if context['article'].anonymous_writer else ""

        result = {}
        result['html'] = render_to_string('community/article/includes/content-edit.html', context, request=request)
        result['tags'] = list(context['tags'].values_list('tag__name', flat=True))

        return JsonResponse(result)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


@login_required
def my_activity(request):
    account = Account.objects.get(user=request.user)
    article_list = Article.objects.filter(writer=account).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
    scrap_list = Article.objects.filter(id__in=ArticleScrap.objects.filter(account=account).values_list('article', flat=True)).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
    comment = ArticleComment.objects.filter(writer=account).order_by('-pub_date')

    article_list = get_article_metas(article_list)
    scrap_list = get_article_metas(scrap_list)

    context = {
        'write_article': article_list,
        'scrap_article': scrap_list,
        'comment_list': comment
    }
    return render(request, 'community/activity.html', context)

def get_article_metas(article_list):
    
    if type(article_list) != list:
        article_list = list(article_list)
    
    article_tags = ArticleTag.objects.filter(article__in=article_list).values('article', 'tag__name', 'tag__type')
    article_tags_dict = {}
    try:
        for atg in article_tags:
            if atg["article"] not in article_tags_dict:
                article_tags_dict[atg["article"]] = []
            article_tags_dict[atg["article"]].append({'name':atg["tag__name"], 'type':atg["tag__type"]})
    except Exception as e:
        print("error tag", e)

    article_likes = ArticleLike.objects.filter(article__in=article_list).values('article').annotate(like_num=Count('article'))
    article_likes_dict = {}
    try:
        for obj in article_likes:
            article_likes_dict[obj["article"]] = obj["like_num"]
    except Exception as e:
        print("like error: ", e)
        
    article_comments = ArticleComment.objects.filter(article__in=article_list).values('article').annotate(comment_num=Count('article'))
    article_comments_dict = {}
    try:
        for obj in article_comments:
            article_comments_dict[obj["article"]] = obj["comment_num"]
    except Exception as e:
        print("comment error: ", e)
        
    article_scraps = ArticleScrap.objects.filter(article__in=article_list).values('article').annotate(scrap_num=Count('article'))
    article_scraps_dict = {}
    try:
        for obj in article_scraps:
            article_scraps_dict[obj["article"]] = obj["scrap_num"]
    except Exception as e:
        print("scrap error: ", e)

    for article in article_list:
        article.tags = article_tags_dict.get(article.id, [])
        article.like_cnt = article_likes_dict.get(article.id, 0)
        article.comment_cnt = article_comments_dict.get(article.id, 0)
        article.scrap_cnt = article_scraps_dict.get(article.id, 0)
        
    return article_list

class redirectView(TemplateView):
    def get(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return render(request, 'community/redirect.html', context)
