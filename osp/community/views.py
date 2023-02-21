from django.http import JsonResponse, Http404
from django.shortcuts import render, redirect
from django.urls import reverse
from django.template.loader import render_to_string
from django.contrib.auth.decorators import login_required
from django.db.models import F, Q, Count
from django.views.decorators.csrf import csrf_exempt

from .models import *
from team.models import TeamMember, Team, TeamTag, TeamInviteMessage
from user.models import Account, AccountInterest, AccountPrivacy
from community.models import TeamRecruitArticle
from team.recommend import get_team_recommendation_list

import math, json, time
from django.views.generic import TemplateView
from datetime import datetime

# Create your views here.

class CommunityMainView(TemplateView):
    def get(self, request, *args, **kwargs):
        board_list = []
        boards = Board.objects.exclude(board_type='User').exclude(board_type='Team')

        for board in boards:

            # 최신 게시물
            article_list = Article.objects.filter(board=board).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
            board.article_list = article_list[:min(8, len(article_list))]
            board.article_list = get_article_metas(board.article_list)
            
            if board.board_type == 'Recruit':
                for article in board.article_list:
                    tr = TeamRecruitArticle.objects.filter(article=article).first()
                    if tr:
                        article.team = tr.team
                    else:
                        article.team = None

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
        if board.board_type == 'Notice':
            return redirect(reverse("community:notice-board"))
        if board.board_type == 'User':
            return redirect(reverse("community:user-board"))

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

            active_article = Article.objects.filter(board=board, period_end__gte=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            active_article = get_article_board_data(active_article)
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


class NoticeView(TemplateView):

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)

        context["need_login"] = False
        context["need_member"] = False
        try:
            board = Board.objects.get(board_type="Notice")
            context["board"] = board
            context["board_id"] = board.id
            context["board_name"] = board.name

        except Board.DoesNotExist:
            raise Http404("게시판을 찾을 수 없습니다.")
        
        context.update(get_auth(board.id, request.user))

        if 'alert' in context:
            return render(request, "community/redirect.html", context)
        if not context['is_auth_notice']:
            context['alert'] ="접근권한이 없습니다."
            context['url'] = reverse("community:main")
            return render(request, "community/redirect.html", context)
        
        return render(request, 'community/tableBoard/table-board.html', context)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class SearchView(TemplateView):
    # page, keyword, tag, team_li
    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        board_id = request.GET.get('board', 0)
        board_id = int(board_id) if board_id.isdigit() else 0
        context["need_login"] = False
        context["need_member"] = False
        try:
            if(board_id):
                board = Board.objects.get(id=board_id)
                board_name = board.name
                context["board"] = board
            else:
                board_name = "전체 게시판"
                board = {"name":board_name, "id":0, "board_type":"Total"}
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

        result = search_article(request, board_name, board_id)
        context['html'] = result['html']
        context['max_page'] = result['max-page']

        keyword = request.GET.get('keyword', '')
        tags = request.GET.get('tag', False)
        context['title'] = board_name 
        if keyword:
            context['title'] += f" 검색어 '{keyword}'" 
        if tags:
            context['title'] += f" 태그 '{tags}'" 
        context['title'] += " 검색 결과"


        return render(request, 'community/tableBoard/searched.html', context)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

def search_article(request, board_name, board_id):
    # 반복문으로 구현
    keyword = request.GET.get('keyword', '')
    tags = request.GET.get('tag', False)
    sort_field = request.GET.get('sort', ('-pub_date', 'title', 'id'))
    page = request.GET.get('page', 1)
    page = int(page) if page.isdigit() else 1
    print("keyword", keyword, " tags", tags)
    try:
        if board_id == 0:
            #전체 검색
            boardList = []
            boards = Board.objects.filter(team_id=None).exclude(board_type='User')
            for board in boards:
                boardList.append(board)

            if request.user.is_authenticated:
                account = Account.objects.get(user=request.user.id)
                team_list = [x.team.name for x in TeamMember.objects.filter(member=account).prefetch_related('team')]
                team_board_query = Q(name__in=team_list)

                for board in Board.objects.filter(team_board_query):
                    boardList.append(board)

            print("total 검색", boardList)
            board_type = "Total"
            board_name = "전체 게시판"
            board_data = {"name":board_name, "id":0, "board_type":board_type}
        else:
            board_data = Board.objects.get(id=board_id)
            board_type = board_data.board_type
            board_name = board_data.name
            boardList = [board_data]
    except Board.DoesNotExist:
        result = {'html': '', 'max-page': 0}
        return JsonResponse(result)
    
    if board_type == 'Recruit':
        PAGE_SIZE = 5
    else:
        PAGE_SIZE = 10

    context = {}
    context['board'] = board_data
    context['type'] = "mix"

    total_article_list = Article.objects.none()
    for board in boardList:
        # Filter Board
        article_list = Article.objects.filter(board=board).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
        article_list = filter_keyword_tag(article_list, keyword, tags)
        total_article_list = total_article_list.union(article_list)
    
    total_len = len(total_article_list)
    # Order
    total_article_list = total_article_list.order_by(*sort_field)
    # Slice to Page
    total_article_list = list(total_article_list[PAGE_SIZE * (page - 1):PAGE_SIZE * (page)])

    total_article_list = get_article_board_data(total_article_list)
    if board_type == 'Recruit' or board_type == "Total":
        for article in total_article_list:
            if article.board_type == 'Recruit':
                tr = TeamRecruitArticle.objects.filter(article=article).first()
                if tr:
                    article.team = tr.team
                else:
                    article.team = None
    # Get Article Metadata
    total_article_list = get_article_metas(total_article_list)

    context['article_list'] = total_article_list
    result = {}
    result['html'] = render_to_string('community/article-table.html', context,request=request)
    result['max-page'] = math.ceil(total_len / PAGE_SIZE)

    return result


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
    context['type'] = "user"

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
    try:
        team_member_dict = get_team_recommendation_list(team_list)
    except:
        team_member_dict = {}
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
    else:
        PAGE_SIZE = 10
    context = {'board': board, 'type': "board"}

    sort_field = request.GET.get('sort', ('-pub_date', 'title', 'id'))
    
    page = int(request.GET.get('page', 1))
    # Filter Board
    article_list = Article.objects.filter(board=board, is_notice=False).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
    # Filter Keyword
    keyword = request.GET.get('keyword', '')
    if keyword != '':
        article_list = article_list.filter(Q(title__icontains=keyword)|Q(body__icontains=keyword))
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

    # Get Article Metadata
    article_list = get_article_board_data(article_list)
    article_list = get_article_metas(article_list)
    
    if board.board_type == 'Recruit':
        for article in article_list:
            tr = TeamRecruitArticle.objects.filter(article=article).first()
            if tr:
                article.team = tr.team
            else:
                article.team = None
    context['notices'] = get_notices(board_id=board_id)
    context['article_list'] = article_list
    result = {}
    result['html'] = render_to_string('community/article-table.html', context,request=request)
    result['max-page'] = math.ceil(total_len / PAGE_SIZE)

    return JsonResponse(result)

def get_notices(board_id = None):
    notice_board = Board.objects.get(board_type="Notice")
    global_notices = Article.objects.filter(board=notice_board, is_notice=True).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
    local_notices = Article.objects.filter(board_id=board_id, is_notice=True).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
    notices = global_notices | local_notices

    notices = get_article_board_data(notices)
    notices = get_article_metas(notices)
    # 쿼리셋 합쳐서 리턴
    return notices


class ArticleSaveView(TemplateView):
    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        board_name = context["board_name"]
        board_id = context["board_id"]
        context["url"] = f"/community/board/{board_name}/{board_id}/"

        if request.user.is_anonymous:
            context["alert"] = "로그인이 필요한 서비스입니다."
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
        context['notice_check'] = ''
        context['is_auth_notice'] = False
        board_id = kwargs.get('board_id')

        context.update(get_auth(board_id, request.user))
        if 'alert' in context:
            return render(request, "community/redirect.html", context)
        
        return render(request, 'community/article/article.html', context)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class ArticleNoticeSaveView(TemplateView):
    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        board = Board.objects.get(board_type="Notice")
        context['board'] = board
        context["board_name"] = board.name
        context["board_id"] = board.id
        context["url"] = "/community/board/notice/"
        if request.user.is_anonymous:
            context["alert"] = "로그인이 필요한 서비스입니다."
            return render(request, "community/redirect.html", context)
        # 쿼리스트링의 값을 가져온다.
        if 'team_id' in request.GET:
            team_id = request.GET['team_id']
            members = TeamMember.objects.filter(team_id=team_id).values_list("member_id", flat=True)
            if request.user.id in members:
                context['team'] = Team.objects.get(id=team_id)
        context['type'] = 'register'
        context['type_kr'] = '등록'
        context['notice_check'] = 'checked'
        context['is_auth_notice'] = False
        context.update(get_auth(board.id, request.user))
        if 'alert' in context:
            return render(request, "community/redirect.html", context)
        if not context['is_auth_notice']:
            context['alert'] ="접근권한이 없습니다."
            context['url'] = reverse("community:main")
            return render(request, "community/redirect.html", context)


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
            context['board'] = Board.objects.get(id=context['article'].board_id)
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

        context['board'] = Board.objects.get(id=context['article'].board.id)
        if context['board'].board_type == 'Recruit':
            teamrecruit = TeamRecruitArticle.objects.filter(article=context['article']).first()
            if teamrecruit:
                context['article'].team = teamrecruit.team
        context['anonymous_check'] = "checked" if context['article'].anonymous_writer else ""
        context['notice_check'] = "checked" if context['article'].is_notice else ""
        context.update(get_auth(context['board'].id, request.user))
        result = {}
        result['html'] = render_to_string('community/article/includes/content-edit.html', context, request=request)
        result['tags'] = list(context['tags'].values_list('tag__name', flat=True))

        return JsonResponse(result)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

@login_required
def activity_board(request):
    context = {'board_name': 'activity', 'board_type': 'activity', 'board_id':0}

    return render(request, 'community/activity.html', context)


@login_required
def my_activity(request):
    keyword = request.GET.get('keyword', '')
    tags = request.GET.get('tag', False)
    page = int(request.GET.get('page', 1))
    activity_type = request.GET.get('type', 'article')
    account = Account.objects.get(user=request.user.id)
    print("activity_type", activity_type)

    if activity_type == "scrap":
        target_list = Article.objects.filter(id__in=ArticleScrap.objects.filter(account=account).values_list('article', flat=True)).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
    elif activity_type == "comment":
        target_list = ArticleComment.objects.filter(writer=account).order_by('-pub_date')
    else :
        target_list = Article.objects.filter(writer=account).annotate(writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')

    if activity_type != "comment":
        target_list = filter_keyword_tag(target_list, keyword, tags)
        target_list = get_article_metas(target_list)
        target_list = get_article_board_data(target_list)
        for article in target_list:
            if article.board_type == 'Recruit':
                tr = TeamRecruitArticle.objects.filter(article=article).first()
                if tr:
                    article.team = tr.team
                else:
                    article.team = None
    else:
        if keyword != '':
            target_list = target_list.filter(Q(body__icontains=keyword))
        comment_board = {}
        for comment in target_list:
            if comment.article.board_id not in comment_board:
                board_id = comment.article.board_id
                board_q = Board.objects.get(id=board_id)
                comment_board[board_id] = board_q.name
        for comment in target_list:
            comment.board_name = comment_board[comment.article.board_id]

    PAGE_SIZE = 10
    total_len = len(target_list)
    target_list = list(target_list[PAGE_SIZE * (page - 1):PAGE_SIZE * (page)])
    context = {
        'target_list': target_list,
        # 'scrap_article': list(scrap_list[PAGE_SIZE * (page - 1):PAGE_SIZE * (page)]),
        # 'comment_list': list(comment_list[PAGE_SIZE * (page - 1):PAGE_SIZE * (page)]), 
    }
    context['activity_type'] = activity_type
    print("context['activity_type']", context['activity_type'])
    context['type'] = 'mix'

    result = {}
    result['html'] = render_to_string('community/activity-tab.html', context, request=request)
    result['max-page'] = math.ceil(total_len / PAGE_SIZE)

    return JsonResponse(result)

# 게시글 리스트를 받아서 게시판 이름을 게시글 객체에 포함시키는 함수
def get_article_board_data(article_list):
    article_board = {}
    for article in article_list:
        if article.board_id not in article_board:
            board_q = Board.objects.get(id=article.board_id)
            article_board[article.board_id] = (board_q.name, board_q.board_type)

    for article in article_list:
        article.board_name, article.board_type = article_board[article.board_id]

    return article_list

# 게시글 리스트를 받아서 태그, 좋아요 수, 스크랩 수, 댓글 수를 게시글 객체에 포함시키는 함수
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

def filter_keyword_tag(article_list, keyword, tags):
    # Filter Keyword
    if keyword != '':
        article_list = article_list.filter(Q(title__icontains=keyword)|Q(body__icontains=keyword))
    # Filter Tag
    if tags:
        tag_list = tags.split(',')
        tag_query = Q()
        for tag in tag_list:
            tag_query = tag_query | Q(tag=tag)
        article_with_tag = ArticleTag.objects.filter(tag_query).values('article')
        article_list = article_list.filter(id__in=article_with_tag)

    return article_list

def get_auth(board_id, user):
    context = {"is_auth_notice": False}
    try:
        print("board_id", board_id)
        context['board'] = Board.objects.get(id=board_id)
        team_id = context['board'].team_id
        print("team", team_id)
        if team_id is not None:
            members = TeamMember.objects.filter(team_id=team_id)
            admin_members = members.filter(is_admin=True).values_list("member_id", flat=True)
            members = members.values_list("member_id", flat=True)
            print("len m", len(members))
            if user.id in admin_members:
                context['team'] = Team.objects.get(id=team_id)
                context['is_auth_notice'] = True
            elif user.id in members:
                context['team'] = Team.objects.get(id=team_id)
            else:
                context["alert"] = "팀에 가입해야 이용가능한 서비스입니다."
        else:
            if user.is_superuser:
                context['is_auth_notice'] = True
    except:
        print("Exception")
        context["alert"] = "오류가 발생했습니다."
    
    return context

class redirectView(TemplateView):
    def get(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return render(request, 'community/redirect.html', context)
