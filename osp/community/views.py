from django.http import JsonResponse, Http404
from django.shortcuts import render
from django.urls import reverse
from django.template.loader import render_to_string
from django.contrib.auth.decorators import login_required
from django.db.models import F, Q, Count
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction, DatabaseError

from rest_framework.response import Response
from rest_framework.views import APIView

from .models import *
from team.models import TeamMember, Team, TeamTag, TeamInviteMessage
from user.models import Account, AccountInterest, AccountPrivacy
from community.models import TeamRecruitArticle, ArticleTag
from team.recommend import get_team_recommendation_list
from community.utils import convert_size

from community.serializers import BoardSerializer, ArticleSerializer, BoardArticleSerializer
from user.serializers import AccountPrivacySerializer
from team.serializers import TeamSerializer, TeamMemberSerializer

import math
import json
import time
from django.views.generic import TemplateView
from datetime import datetime

import team.utils

import logging


class CommunityMainView(APIView):
    '''
    GET: 커뮤니티 메인화면을 위한 JSON response
    URL : /community
    '''

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}

        user = request.user

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(request, *args, **kwargs)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(f'CommunityMainView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        data = {}
        try:
            data['show_searchbox'] = True
            boards = Board.objects.exclude(
                board_type='User').exclude(board_type='Team')
            for board in boards:
                # 최신 게시물
                article_list = Article.objects.filter(board=board).annotate(writer_name=F(
                    "writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
                article_list = article_list[:min(8, len(article_list))]
                article_list = get_article_metas(article_list)
                board.article_list = article_list

                if board.board_type == 'Recruit':
                    for article in board.article_list:
                        tr = TeamRecruitArticle.objects.filter(
                            article=article).first()
                        if tr:
                            article.team = tr.team
                        else:
                            article.team = None

                meta = BoardSerializer(board).data
                articles = ArticleSerializer(article_list, many=True).data

                data['boards_'+board.board_type+'_meta'] = meta
                data['boards_'+board.board_type +
                     '_articles'] = articles

        except DatabaseError as e:
            # Database Exception handling
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'CommunityMainView DB ERROR: {e}')
            status = 'fail'

        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception ' + str(e)
            logging.exception(f'CommunityMainView ERROR: {e}')
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class TableBoardView(APIView):
    '''
    GET: 일반게시판, 팀 게시판, 팀 모집 게시판을 위한 JSON response
    URL : /community/api/board/<board_name>/

    '''

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}

        user = request.user
        board_name = kwargs.get('board_name')
        try:
            board = Board.objects.get(name=board_name)
            valid_data['board'] = board
            if board.board_type == 'Team':
                teaminvitemessage = TeamInviteMessage.objects.filter(
                    team__id=board.team_id, account__user=request.user, direction=True, status=0)
                if not request.user.is_authenticated:
                    errors["require_login"] = "팀게시판에 접근하기 위해서는 로그인이 필요합니다."
                    status = 'fail'
                elif not team.utils.is_teammember(board.team.id, user.id):
                    if not teaminvitemessage.exists():
                        errors["user_is_not_teammember"] = "해당 팀의 멤버가 아닙니다. "
                        status = 'fail'
                    else:
                        valid_data['teaminvitemessage'] = teaminvitemessage
                else:
                    valid_data['teaminvitemessage'] = teaminvitemessage
            elif board.board_type == 'Notice':
                errors["invalid_url"] = "공지게시판 api 접근 url 은 /community/api/board/notice 입니다."
                status = 'fail'
            elif board.board_type == 'User':
                errors["invalid_url"] = "유저추천 게시판 api 접근 url 은 /community/api/recommender/user/ 입니다."
                status = 'fail'

        except Board.DoesNotExist:
            errors["board_not_found"] = "해당 게시판이 존재하지않습니다."
            status = 'fail'

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(request, *args, **kwargs)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(f'TableBoardView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        data = {}
        try:
            data['show_searchbox'] = True
            board = valid_data['board']
            data["board"] = BoardSerializer(board).data
            user = request.GET.get('user')

            if request.user.is_authenticated:
                account = Account.objects.get(user=request.user)
                try:
                    acc_pp = AccountPrivacy.objects.get(account=account)
                except:
                    acc_pp = AccountPrivacy.objects.create(
                        account=account, open_lvl=1, is_write=False, is_open=False)
                data['privacy'] = AccountPrivacySerializer(acc_pp).data

            else:
                account = None
                data['privacy'] = None

            article_list = Article.objects.filter(board=board).annotate(writer_name=F(
                "writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
            article_list = get_article_metas(article_list)

            # data['articles'] = get_article_metas(article_list)
            print(article_list)
            data['articles'] = BoardArticleSerializer(
                article_list, many=True).data

            # 팀 게시판
            if board.board_type == 'Team':

                # 팀에 초대받은 상태일 경우 메시지와 invited_user True 전달해 표시
                # 그외의 경우 커뮤니티 메인페이지로 리다이렉트
                account = Account.objects.get(user=request.user)
                teaminvitemessage = valid_data['teaminvitemessage']

                if teaminvitemessage.exists():
                    # 팀 멤버라면 초대 상태 리셋
                    data['is_invited_user'] = False

                elif teaminvitemessage.exists():
                    # 초대 상태로 설정
                    data['is_invited_user'] = True

                team = board.team
                team_tags = TeamTag.objects.filter(team=team).values(
                    'team', 'tag__name', 'tag__type')
                team_tags_list = []
                for atg in team_tags:
                    team_tags_list.append(
                        {'name': atg["tag__name"], 'type': atg["tag__type"]})

                team_members = TeamMember.objects.filter(team=team).order_by(
                    '-is_admin').prefetch_related('member__user')

                # 검색한 팀 멤버에서 유저 검색
                tm = team_members.filter(member=account).first()
                if tm:
                    data['team_admin'] = tm.is_admin
                data['team'] = TeamSerializer(team).data
                data['team_tags'] = team_tags_list
                data['team_members'] = TeamMemberSerializer(
                    team_members, many=True).data

            # 팀 모집 게시판일 경우
            if board.board_type == 'Recruit':
                account = Account.objects.get(user=request.user)
                active_article = Article.objects.filter(
                    board=board, period_end__gte=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
                active_article = get_article_board_data(active_article)
                for article in active_article:
                    article.tags = [
                        art_tag.tag for art_tag in ArticleTag.objects.filter(article=article)]
                    teamrecruitarticle = TeamRecruitArticle.objects.filter(
                        article=article).first()
                    if teamrecruitarticle:
                        article.team = teamrecruitarticle.team
                    else:
                        article.team = None

                team_cnt = len(TeamMember.objects.filter(
                    member=account).prefetch_related('team'))

                data['team_cnt'] = team_cnt
                data['active_article'] = ArticleSerializer(
                    active_article, many=True).data

        except DatabaseError as e:
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'TableBoardView DB ERROR: {e}')
            status = 'fail'

        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception : ' + \
                str(e)
            logging.exception(f'TableBoardView undefined ERROR: {e}')
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}
        return Response(res)


class NoticeView(APIView):
    '''
    GET: 공지게시판을 위한 JSON response
    URL : /community/board/notice
    '''

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}
        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'
        else:
            try:
                board = Board.objects.get(board_type="Notice")
                valid_data['board'] = board
            except Board.DoesNotExist:
                errors["board_not_found"] = "해당 게시판이 존재하지않습니다."
                status = 'fail'
            if user.is_superuser != 1:
                errors["user_is_not_superuser"] = "어드민계정만 접근할 수 있는 게시판 입니다."
                status = 'fail'

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(request, *args, **kwargs)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(f'NoticeView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        data = {}
        try:
            data["require_login"] = False
            data["require_membership"] = False
            data['show_notice_check'] = True

            board = valid_data['board']
            data["board"] = BoardSerializer(board).data

            data.update(get_auth(board.id, request.user))
            article_list = Article.objects.filter(board=board).annotate(writer_name=F(
                "writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
            # article_list = article_list[:min(8, len(article_list))]
            article_list = get_article_metas(article_list)
            data['articles'] = ArticleSerializer(article_list, many=True).data

        except DatabaseError as e:
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'NoticeView DB ERROR: {e}')
            status = 'fail'
        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception : ' + str(e)
            logging.exception(f'NoticeView undefined ERROR : {e}')
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'data': data}
        else:
            res = {'status': status, 'errors': errors}
        return Response(res)


class SearchView(APIView):
    '''
    GET: 검색된 게시글 모음
    URL : /community/search

    JSON RESPONSE
    data :
        board : 검색 대상 게시판
        show_searchbox : 해당 뷰에서 항상 true
        require_login : 해당 뷰에서 항상 false
        require_membership : 해당 뷰에서 항상 false
        privacy : AccountPrivacy 모델에 저장된 값
        max_page : 검색된 게시글 개수 / PAGE_SIZE
        articles : 검색된 게시글 리스트
    '''

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}
        user = request.user

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(request, *args, **kwargs)

        # Transactions
        data = {}
        try:
            board_id = request.GET.get('board', 0)
            board_id = int(board_id) if board_id.isdigit() else 0

            data["require_login"] = False
            data["require_membership"] = False
            data['show_searchbox'] = True
            if (board_id):
                board = Board.objects.get(id=board_id)
                board_name = board.name
                data["board"] = BoardSerializer(board).data
            else:
                board_name = "전체"
                board = {"name": board_name, "id": 0, "board_type": "Total"}
                data["board"] = board

            # 로그인된 정보공개 설정을 확인한다.
            if request.user.is_authenticated:
                account = Account.objects.get(user_id=request.user.id)

                try:
                    acc_pp = AccountPrivacy.objects.get(account=account)
                except:
                    acc_pp = AccountPrivacy.objects.create(
                        account=account, open_lvl=1, is_write=False, is_open=False)
                data['privacy'] = AccountPrivacySerializer(acc_pp).data
            else:
                account = None
                data['privacy'] = {'is_write': 0, 'is_open': 0}

            result = search_article(request, board_name, board_id)

            data['articles'] = ArticleSerializer(
                result['articles'], many=True).data
            data['max_page'] = result['max-page']

        except DatabaseError as e:
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'SearchView DB ERROR: {e}')
            status = 'fail'

        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception : ' + str(e)
            logging.exception(f'SearchView undefined ERROR : {e}')
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


def search_article(request, board_name, board_id):
    '''
    게시글 검색

    RETURN dictionary
    '''
    # 반복문으로 구현

    # Get values from request
    # url ex) /community/search/?page=1&keyword=abcd&tag=&board=0

    keyword = request.GET.get('keyword', '')
    tags = request.GET.get('tag', False)
    sort_field = request.GET.get('sort', ('-pub_date', 'title', 'id'))
    page = request.GET.get('page', 1)
    page = int(page) if page.isdigit() else 1

    print("keyword", keyword, " tags", tags)

    # 타겟 게시판 설정
    try:
        if board_id == 0:
            # 전체 검색
            boardList = []

            boards = Board.objects.filter(
                team_id=None).exclude(board_type='User')

            for board in boards:
                boardList.append(board)

            if request.user.is_authenticated:
                account = Account.objects.get(user=request.user.id)
                team_list = [x.team.name for x in TeamMember.objects.filter(
                    member=account).prefetch_related('team')]
                team_board_query = Q(name__in=team_list)

                for board in Board.objects.filter(team_board_query):
                    boardList.append(board)

            print("total 검색", boardList)
            board_type = "Total"
            board_name = "전체"
            board_data = {"name": board_name,
                          "id": 0, "board_type": board_type}
        else:
            board_data = Board.objects.get(id=board_id)
            board_type = board_data.board_type
            board_name = board_data.name
            boardList = [board_data]

    except Board.DoesNotExist:
        result = {'article': None, 'max-page': 0}
        return result

    if board_type == 'Recruit':
        PAGE_SIZE = 5
    else:
        PAGE_SIZE = 10

    data = {}
    data['board'] = board_data
    data['type'] = "mix"

    total_article_list = Article.objects.none()
    for board in boardList:
        # Filter Board
        if board.board_type == "Notice" and not request.user.is_superuser:
            # 일반유저가 검색할 때는 공지게시판에서 공지 설정된 게시글만 가져옴
            article_list = Article.objects.filter(board=board, is_notice=True).annotate(
                writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
        else:
            article_list = Article.objects.filter(board=board).annotate(writer_name=F(
                "writer__user__username"), is_superuser=F("writer__user__is_superuser"))
        article_list = filter_keyword_tag(article_list, keyword, tags)
        total_article_list = total_article_list.union(article_list)

    total_len = len(total_article_list)
    # Order
    total_article_list = total_article_list.order_by(*sort_field)
    # Slice to Page
    total_article_list = list(
        total_article_list[PAGE_SIZE * (page - 1):PAGE_SIZE * (page)])

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

    result = {}
    result['articles'] = total_article_list
    result['max-page'] = math.ceil(total_len / PAGE_SIZE)

    return result


class UserBoardView(APIView):
    '''
    GET: 
    URL : /community/recommender/user/

    JSON RESPONSE
    data :
        user_teams : 소속 팀 목록 리스트
        recommended_teams : 팀 추천 리스트
        privacy : 개인정보 공개 단계

    '''

    def get(self, request, *args, **kwargs):
        data = {}
        try:
            board = Board.objects.get(name="User")
            board = BoardSerializer(board).data
        except Board.DoesNotExist:
            return Http404("유저 추천 게시판이 없습니다.")

        data = {'board': board, 'type': 'user'}
        try:
            acc_pp = AccountPrivacy.objects.get(account=request.user.id)
            data['privacy'] = AccountPrivacySerializer(acc_pp).data
        except Exception as e:
            print("community view account_cards error: ", e)

        res = {'status': 'success', 'data': data}
        return Response(res)


def account_cards(request):
    '''
    유저 카드 목록
    url        : community/account-cards/
    query      : page=1&team_li=%5B%5D&type=article HTTP/1.1" 200 10635

    RETURN dictionary

    '''

    start = time.time()
    PAGE_SIZE = 9

    data = {}
    data['board'] = Board.objects.get(board_type="User")
    board = BoardSerializer(board).data
    data['account_list'] = []

    # Filter Board
    open_acc = AccountPrivacy.objects.filter(is_open=True).exclude(
        account=request.user.id).values('account_id')
    print("open_acc", len(open_acc))

    account_list = Account.objects.filter(
        user__is_superuser=False, user__id__in=open_acc)
    # Filter Keyword
    keyword = request.GET.get('keyword', '')
    team_li = json.loads(request.GET.get('team_li', "[]"))
    print("team_li", team_li)

    if request.user.is_anonymous:
        team_li = []
    elif team_li == ['first']:
        team_li = list(TeamMember.objects.filter(
            member__user=request.user).values_list("team_id", flat=True))

    if keyword != '':
        account_list = account_list.filter(
            Q(user__username__icontains=keyword) | Q(introduction__icontains=keyword))
    # Filter Tag
    tag_list = request.GET.get('tag', False)
    if tag_list:
        tag_list = tag_list.split(',')
        tag_query = Q()
        for tag in tag_list:
            tag_query = tag_query | Q(tag=tag)
        article_with_tag = AccountInterest.objects.filter(
            tag_query).values('account__user')
        account_list = account_list.filter(user__in=article_with_tag)

    user_list = []
    member_id = []

    team_list = Team.objects.filter(id__in=team_li)
    print("team_list", team_list)

    if len(team_list) == 0:
        user_list = list(account_list)
    else:
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

    account_list = user_list
    total_len = len(account_list)

    result = {'html': []}
    for account in account_list:
        data['account'] = account
        result['html'].append(render_to_string(
            'community/account-card.html', data, request=request))
    print("html len", len(result['html']))

    result['max-page'] = math.ceil(total_len / PAGE_SIZE)
    if result['max-page'] == 0:
        result['html'] = "추천할 사용자가 없습니다."
    result['offset'] = PAGE_SIZE
    print("elapsed time account_cards", time.time() - start)

    return result


def article_list(request, board_name):
    try:
        board = Board.objects.get(name=board_name)
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
    article_list = Article.objects.filter(board=board, is_notice=False).annotate(
        writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
    # Filter Keyword
    keyword = request.GET.get('keyword', '')
    if keyword != '':
        article_list = article_list.filter(
            Q(title__icontains=keyword) | Q(body__icontains=keyword))
    # Filter Tag
    tag_list = request.GET.get('tag', False)
    if tag_list:
        tag_list = tag_list.split(',')
        tag_query = Q()
        for tag in tag_list:
            tag_query = tag_query | Q(tag=tag)
        article_with_tag = ArticleTag.objects.filter(
            tag_query).values('article')
        article_list = article_list.filter(id__in=article_with_tag)

    total_len = len(article_list)
    # Order
    article_list = article_list.order_by(*sort_field)
    # Slice to Page
    article_list = list(
        article_list[PAGE_SIZE * (page - 1):PAGE_SIZE * (page)])

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
    context['notices'] = get_notices(board_id=board.id)
    context['article_list'] = article_list
    result = {}
    result['html'] = render_to_string(
        'community/article-table.html', context, request=request)
    result['max-page'] = math.ceil(total_len / PAGE_SIZE)

    return result


def get_notices(board_id=None):
    notice_board = Board.objects.get(board_type="Notice")
    global_notices = Article.objects.filter(board=notice_board, is_notice=True).annotate(
        writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
    local_notices = Article.objects.filter(board_id=board_id, is_notice=True).annotate(
        writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
    notices = global_notices | local_notices

    notices = get_article_board_data(notices)
    notices = get_article_metas(notices)
    # 쿼리셋 합쳐서 리턴
    return notices


class ArticleNoticeSaveView(APIView):
    '''
    GET: 공지사항 작성
    URL : board/<board_name>/<board_id>/save/

    JSON RESPONSE
    data :
        show_anonymous_check : 해당 뷰에서 항상 true
        show_notice_check : 해당 뷰에서 항상 false
    '''

    def get(self, request, *args, **kwargs):

        data = {}
        board = Board.objects.get(board_type="Notice")
        data['board'] = board
        data["board_name"] = board.name
        data["board_id"] = board.id
        data["url"] = "/community/board/notice/"
        if request.user.is_anonymous:
            data["alert"] = "로그인이 필요한 서비스입니다."
            res = {'status': 'fail', 'msg': '로그인이 필요한 서비스입니다.'}
            return Response(res)
        # 쿼리스트링의 값을 가져온다.
        if 'team_id' in request.GET:
            team_id = request.GET['team_id']
            members = TeamMember.objects.filter(
                team_id=team_id).values_list("member_id", flat=True)
            if request.user.id in members:
                data['team'] = Team.objects.get(id=team_id)
        data['type'] = 'register'
        data['type_kr'] = '등록'
        data['notice_check'] = 'checked'
        data['show_notice_check'] = False
        data.update(get_auth(board.id, request.user))

        if 'alert' in data:
            res = {'status': 'fail', 'msg': '접근이 제한되었습니다.'}
            return Response(res)
        if not data['is_auth_notice']:
            data['alert'] = "접근권한이 없습니다."
            data['url'] = reverse("community:main")
            res = {'status': 'fail', 'msg': '접근이 제한되었습니다.'}
            return Response(res)

        res = {'status': 'success', 'data': data}
        return Response(res)


class ArticleView(TemplateView):

    @csrf_exempt
    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        context['type'] = 'view'
        context['is_community'] = True
        article_id = kwargs.get('article_id')

        try:
            article = Article.objects.get(id=article_id)
            context['tags'] = ArticleTag.objects.filter(article__id=article_id)
            context['board'] = Board.objects.get(id=article.board_id)
            context['comments'] = ArticleComment.objects.filter(
                article_id=article_id)
            if context['board'].board_type == 'Recruit':
                teamrecruit = TeamRecruitArticle.objects.filter(
                    article=article).first()
                if teamrecruit:
                    article.team = teamrecruit.team
            if article.writer.user_id != request.user.id:
                article.view_cnt += 1
            article.save()
            article_file_objs = ArticleFile.objects.filter(
                article_id=article.id, status="POST")
            article_files = []
            for obj in article_file_objs:
                article_files.append({'id': obj.id,
                                      'name': obj.filename,
                                      'file': obj.file.name,
                                      'size': convert_size(obj.file.size)})
            context['article'] = article
            context['article_file'] = article_files
        except:
            context['error_occur'] = True

        context["need_login"] = False
        context["need_member"] = False
        if context['board'].board_type == 'Team':
            if not request.user.is_authenticated:
                context["need_login"] = True
                return render(request, 'community/article/article.html', context)
            if not TeamMember.objects.filter(team=context['board'].team_id, member_id=request.user.id).exists():
                # 팀 멤버가 아니면 열람 불가
                context["need_member"] = True
                return render(request, 'community/article/article.html', context)

        return render(request, 'community/article/article.html', context)

    def post(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)
        context['type'] = 'edit'
        context['type_kr'] = '수정'

        article_id = kwargs.get('article_id')
        context['article'] = Article.objects.get(id=article_id)
        article_file_objs = ArticleFile.objects.filter(
            article_id=article_id, status="POST")
        article_files = []
        for obj in article_file_objs:
            article_files.append({'id': obj.id,
                                  'name': obj.filename,
                                  'file': obj.file.name,
                                  'size': convert_size(obj.file.size)})
        context['article_file'] = article_files
        context['tags'] = ArticleTag.objects.filter(article__id=article_id)

        context['board'] = Board.objects.get(id=context['article'].board.id)
        if context['board'].board_type == 'Recruit':
            teamrecruit = TeamRecruitArticle.objects.filter(
                article=context['article']).first()
            if teamrecruit:
                context['article'].team = teamrecruit.team

        context['anonymous_check'] = "checked" if context['article'].anonymous_writer else ""
        context['notice_check'] = "checked" if context['article'].is_notice else ""
        context.update(get_auth(context['board'].id, request.user))
        result = {}
        result['html'] = render_to_string(
            'community/article/includes/content-edit.html', context, request=request)
        result['tags'] = list(
            context['tags'].values_list('tag__name', flat=True))

        return JsonResponse(result)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


@login_required
def activity_board(request):
    context = {'board_name': 'activity',
               'board_type': 'activity', 'board_id': 0}

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
        target_list = Article.objects.filter(id__in=ArticleScrap.objects.filter(account=account).values_list('article', flat=True)).annotate(
            writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')
    elif activity_type == "comment":
        target_list = ArticleComment.objects.filter(
            writer=account).order_by('-pub_date')
    else:
        target_list = Article.objects.filter(writer=account).annotate(writer_name=F(
            "writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by('-pub_date')

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
    result['html'] = render_to_string(
        'community/activity-tab.html', context, request=request)
    result['max-page'] = math.ceil(total_len / PAGE_SIZE)

    return JsonResponse(result)

# 게시글 리스트를 받아서 게시판 이름을 게시글 객체에 포함시키는 함수


def get_article_board_data(article_list):
    article_board = {}
    for article in article_list:
        if article.board_id not in article_board:
            board_q = Board.objects.get(id=article.board_id)
            article_board[article.board_id] = (
                board_q.name, board_q.board_type)

    for article in article_list:
        article.board_name, article.board_type = article_board[article.board_id]

    return article_list

# 게시글 리스트를 받아서 태그, 좋아요 수, 스크랩 수, 댓글 수를 게시글 객체에 포함시키는 함수


def get_article_metas(article_list):

    if type(article_list) != list:
        article_list = list(article_list)

    article_tags = ArticleTag.objects.filter(
        article__in=article_list).values('article', 'tag__name', 'tag__type')
    article_tags_dict = {}
    try:
        for atg in article_tags:
            if atg["article"] not in article_tags_dict:
                article_tags_dict[atg["article"]] = []
            article_tags_dict[atg["article"]].append(
                {'name': atg["tag__name"], 'type': atg["tag__type"]})
    except Exception as e:
        print("error tag", e)

    article_likes = ArticleLike.objects.filter(article__in=article_list).values(
        'article').annotate(like_num=Count('article'))
    article_likes_dict = {}
    try:
        for obj in article_likes:
            article_likes_dict[obj["article"]] = obj["like_num"]
    except Exception as e:
        print("like error: ", e)

    article_comments = ArticleComment.objects.filter(article__in=article_list).values(
        'article').annotate(comment_num=Count('article'))
    article_comments_dict = {}
    try:
        for obj in article_comments:
            article_comments_dict[obj["article"]] = obj["comment_num"]
    except Exception as e:
        print("comment error: ", e)

    article_scraps = ArticleScrap.objects.filter(article__in=article_list).values(
        'article').annotate(scrap_num=Count('article'))
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
        article_list = article_list.filter(
            Q(title__icontains=keyword) | Q(body__icontains=keyword))
    # Filter Tag
    if tags:
        tag_list = tags.split(',')
        tag_query = Q()
        for tag in tag_list:
            tag_query = tag_query | Q(tag=tag)
        article_with_tag = ArticleTag.objects.filter(
            tag_query).values('article')
        article_list = article_list.filter(id__in=article_with_tag)

    return article_list


def get_auth(board_id, user):
    context = {"show_notice_check": False}
    try:
        print("board_id", board_id)
        context['board'] = BoardSerializer(Board.objects.get(id=board_id)).data
        team_id = context['board'].team_id
        print("team", team_id)
        if team_id is not None:
            members = TeamMember.objects.filter(team_id=team_id)
            admin_members = members.filter(
                is_admin=True).values_list("member_id", flat=True)
            members = members.values_list("member_id", flat=True)
            print("len m", len(members))
            if user.id in admin_members:
                context['team'] = Team.objects.get(id=team_id)
                context['show_notice_check'] = True
            elif user.id in members:
                context['team'] = Team.objects.get(id=team_id)
            else:
                context["alert"] = "팀에 가입해야 이용가능한 서비스입니다."
        else:
            if user.is_superuser:
                context['show_notice_check'] = True
    except:
        print("Exception")
        context["alert"] = "오류가 발생했습니다."

    return context


class redirectView(TemplateView):
    def get(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return render(request, 'community/redirect.html', context)
