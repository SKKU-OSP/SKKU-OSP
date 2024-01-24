import json
import logging
import math
import os
from datetime import datetime, timedelta

from django.core.paginator import Paginator
from django.db import DatabaseError, transaction
from django.db.models import Count, F, OuterRef, Q, Subquery
from django.http import FileResponse
from django.urls import reverse
from rest_framework.response import Response
from rest_framework.views import APIView

from community.models import *
from community.serializers import (ArticleCommentSerializer, ArticleSerializer,
                                   BoardArticleSerializer, BoardSerializer,
                                   RecruitArticleSerializer)
from community.utils import convert_size, convert_to_boolean
from osp.settings import MEDIA_ROOT
from tag.serializers import TagIndependentSerializer
from team.models import Team, TeamInviteMessage, TeamMember, TeamTag
from team.serializers import TeamMemberSerializer, TeamSerializer
from team.utils import is_teammember
from user.models import Account, AccountPrivacy
from user.serializers import AccountPrivacySerializer


class TableBoardView(APIView):
    '''
    GET: 일반게시판, 팀 게시판, 팀 모집 게시판을 위한 JSON response
    URL : /community/api/board/<board_name>/?page_number=

    '''

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}

        user = request.user
        board_name = kwargs.get('board_name')
        page_number = request.GET.get('page_number')
        try:
            board = Board.objects.get(name=board_name)
            valid_data['board'] = board
            if board.board_type == 'Team':
                if not request.user.is_authenticated:
                    errors["require_login"] = "팀게시판에 접근하기 위해서는 로그인이 필요합니다."
                    status = 'fail'
                    return status, message, errors, valid_data
                teaminvitemessage = TeamInviteMessage.objects.filter(
                    team__id=board.team_id, account__user=request.user, direction=True, status=0)
                if not is_teammember(board.team.id, user.id):
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
            if not page_number:
                pass
            elif int(page_number) < 0:
                errors["invalid_page_number"] = "잘못된 page_number 입니다."
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
            print(errors)
            message = list(errors.values())[0]
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        data = {}
        try:
            data['show_searchbox'] = True
            board = valid_data['board']
            data["board"] = BoardSerializer(board).data

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

            if board.board_type == 'Recruit':
                data = self.get_recruit_board(request)
                return Response({'status': status, 'data': data})

            sort_field = request.GET.get('sort', '-id')
            sort_field = sort_field.split(",")
            article_list = Article.objects.filter(board=board).annotate(writer_name=F(
                "writer__user__username"), is_superuser=F("writer__user__is_superuser")).order_by(*sort_field)

            page_size = 10
            paginator = Paginator(article_list, page_size)
            page_number = request.GET.get('page_number', 1)
            page = paginator.get_page(page_number)
            max_page_number = paginator.num_pages
            # article_list = get_article_metas(article_list)
            article_list = get_article_metas(page)
            data['max_page_number'] = max_page_number
            data['articles'] = BoardArticleSerializer(
                article_list, many=True).data

            # 팀 게시판
            if board.board_type == 'Team':

                # 팀에 초대받은 상태일 경우 메시지와 invited_user True 전달해 표시
                # 그외의 경우 커뮤니티 메인페이지로 리다이렉트
                account = Account.objects.get(user=request.user)
                teaminvitemessage = valid_data['teaminvitemessage']

                if TeamMember.objects.filter(team=board.team_id, member_id=request.user.id).exists():
                    # 팀 멤버라면 초대 상태 리셋
                    data['invite_id'] = 0

                elif teaminvitemessage.exists():
                    # 초대 상태로 설정
                    data['invite_id'] = teaminvitemessage.last().id

                team = board.team
                team_tags = TagIndependent.objects.filter(
                    teamtag__team_id=team)
                data['team_tags'] = TagIndependentSerializer(
                    team_tags, many=True).data

                team_members = TeamMember.objects.filter(team=team).order_by(
                    '-is_admin').prefetch_related('member__user')

                # 검색한 팀 멤버에서 유저 검색
                tm = team_members.filter(member=account).first()
                if tm:
                    data['team_admin'] = tm.is_admin
                data['team'] = TeamSerializer(team).data
                data['team_members'] = TeamMemberSerializer(
                    team_members, many=True).data

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

    def get_recruit_board(self, request):
        data = {}
        page_number = request.GET.get('page_number', 1)
        sort_field = request.GET.get('sort', '-id')
        sort_field = sort_field.split(",")

        team_recruit_subquery = TeamRecruitArticle.objects.filter(
            article_id=OuterRef('pk')
        ).annotate(
            writer_name=Subquery(
                Account.objects.filter(pk=OuterRef(
                    'article__writer_id')).values('user__username')[:1]
            ),
            team_name=Subquery(
                Team.objects.filter(pk=OuterRef('team_id')).values('name')[:1]
            ),
            member_cnt=Subquery(
                TeamMember.objects.filter(team_id=OuterRef('team_id')).values(
                    'team').annotate(cnt=Count('id')).values('cnt')
            ),
        )

        articles = Article.objects.filter(
            board__name='팀 모집'
        ).annotate(
            writer_name=Subquery(
                team_recruit_subquery.values('writer_name')[:1]),
            team_name=Subquery(team_recruit_subquery.values('team_name')[:1]),
            member_cnt=Subquery(
                team_recruit_subquery.values('member_cnt')[:1]),
        ).prefetch_related(
            'articletag_set'
        ).order_by(*sort_field)

        page_size = 10
        paginator = Paginator(articles, page_size)
        page = paginator.get_page(page_number)

        data['max_page_number'] = paginator.num_pages
        data['articles'] = RecruitArticleSerializer(page, many=True).data
        return data


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

    def get_validation(self, request):
        board_name = request.GET.get("board", None)
        status = "success"
        errors = {}
        vaild_data = {"board": None}
        if board_name:
            try:
                vaild_data['board'] = Board.objects.get(name=board_name)
            except Board.DoesNotExist as e:
                logging.exception(f"search_view {e}")
                errors["board_not_found"] = "해당 게시판이 존재하지않습니다."
                status = 'fail'
            except Exception as e:
                logging.exception(f"search_view {e}")
                errors['undefined_exception'] = 'undefined_exception'
                status = 'fail'
        return status, errors, vaild_data

    def get(self, request, *args, **kwargs):
        # Declaration
        message = ''
        data = {}

        # Request Validation
        status, errors, valid_data = self.get_validation(request)

        # Transactions
        try:
            board = valid_data['board']
            data["require_login"] = False
            data["require_membership"] = False
            data['show_searchbox'] = True
            if board:
                board = BoardSerializer(board).data
                data['board'] = board
            else:
                board = {"name": "전체", "id": 0, "board_type": "Total"}
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
            result = search_article(request, board)
            data['articles'] = BoardArticleSerializer(
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


def search_article(request, board):
    '''
    게시글 검색

    RETURN dictionary
    '''
    # 반복문으로 구현

    # Get values from request
    # url ex) /community/search/?page=1&keyword=abcd&tag=&board=0

    keyword = request.GET.get('keyword', '')
    tags = request.GET.get('tag', None)
    sort_field = request.GET.get('sort', '-id')
    sort_field = sort_field.split(',')
    page = request.GET.get('page', "1")
    page = int(page) if page.isdigit() else 1

    print("keyword", keyword, " tags", tags)
    board_list = []
    # 타겟 게시판 설정
    try:
        if board["id"] == 0:
            # 전체 검색

            boards = Board.objects.filter(
                team_id=None).exclude(board_type='User')

            for obj in boards:
                board_list.append(obj)

            if request.user.is_authenticated:
                account = Account.objects.get(user=request.user.id)
                team_list = [x.team.name for x in TeamMember.objects.filter(
                    member=account).prefetch_related('team')]
                team_board_query = Q(name__in=team_list)

                for obj in Board.objects.filter(team_board_query):
                    board_list.append(obj)
        else:
            board_list = list(Board.objects.filter(name=board["name"]))

    except Board.DoesNotExist:
        result = {'article': None, 'max-page': 0}
        return result

    PAGE_SIZE = 5 if board['board_type'] == 'Recruit' else 10

    data = {}
    data['board'] = board
    data['type'] = "mix"

    total_article_list = Article.objects.none()
    for obj in board_list:
        # Filter Board
        if obj.board_type == "Notice" and not request.user.is_superuser:
            # 일반유저가 검색할 때는 공지게시판에서 공지 설정된 게시글만 가져옴
            article_list = Article.objects.filter(board=obj, is_notice=True).annotate(
                writer_name=F("writer__user__username"), is_superuser=F("writer__user__is_superuser"))
        else:
            article_list = Article.objects.filter(board=obj).annotate(writer_name=F(
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
    if board["board_type"] == 'Recruit' or board["board_type"] == "Total":
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


class UserArticlesView(APIView):
    '내가 작성한 글'

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}

        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(request, *args, **kwargs)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(f'UserArticlesView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        data = {}
        try:
            user = request.user
            sort_field = request.GET.get('sort', '-id')
            sort_field = sort_field.split(',')
            account = Account.objects.get(user=user)
            user_articles = Article.objects.filter(
                writer=account).order_by(*sort_field)
            user_articles = get_article_metas(user_articles)

            page_size = 10
            paginator = Paginator(user_articles, page_size)
            page_number = request.GET.get('page_number')
            if not page_number:
                page_number = 1
            page = paginator.get_page(page_number)
            max_page_number = paginator.num_pages
            # article_list = get_article_metas(article_list)

            user_articles = get_article_metas(page)
            data['max_page_number'] = max_page_number
            data['user_articles'] = BoardArticleSerializer(
                user_articles, many=True).data

        except DatabaseError as e:
            # Database Exception handling
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'UserArticlesView DB ERROR: {e}')
            status = 'fail'

        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception ' + str(e)
            logging.exception(f'UserArticlesView ERROR: {e}')
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class UserCommentsView(APIView):
    '내가 작성한 댓글'

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}

        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(request, *args, **kwargs)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(f'UserCommentsView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        data = {}
        try:
            user = request.user
            sort_field = request.GET.get('sort', '-id')
            sort_field = sort_field.split(',')
            account = Account.objects.get(user=user)
            articlecomments = ArticleComment.objects.filter(
                writer=account).exclude(is_deleted=1).order_by(*sort_field)

            page_size = 10
            paginator = Paginator(articlecomments, page_size)
            page_number = request.GET.get('page_number')
            if not page_number:
                page_number = 1
            page = paginator.get_page(page_number)
            max_page_number = paginator.num_pages

            articlecomments = page
            data['max_page_number'] = max_page_number
            data['articlecomments'] = ArticleCommentSerializer(
                articlecomments, many=True).data

        except DatabaseError as e:
            # Database Exception handling
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'UserCommentsView DB ERROR: {e}')
            status = 'fail'

        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception ' + str(e)
            logging.exception(f'UserCommentsView ERROR: {e}')
            status = 'fail'
        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class UserScrapArticlesView(APIView):
    '내가 스크랩한 글'

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}

        user = request.user
        if not user.is_authenticated:
            errors["require_login"] = "로그인이 필요합니다."
            status = 'fail'

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(request, *args, **kwargs)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(f'UserScrapArticlesView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        data = {}
        try:
            user = request.user
            sort_field = request.GET.get('sort', '-id')
            sort_field = sort_field.split(',')
            account = Account.objects.get(user=user)
            article_scraps = ArticleScrap.objects.filter(
                account=account).values_list('article')

            user_scrap_articles = Article.objects.filter(
                id__in=article_scraps).order_by(*sort_field)

            page_size = 10
            paginator = Paginator(user_scrap_articles, page_size)
            page_number = request.GET.get('page_number')
            if not page_number:
                page_number = 1
            page = paginator.get_page(page_number)
            max_page_number = paginator.num_pages

            user_scrap_articles = get_article_metas(page)

            data['max_page_number'] = max_page_number
            data['userscraparticles'] = BoardArticleSerializer(
                user_scrap_articles, many=True).data
        except DatabaseError as e:
            # Database Exception handling
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'UserScrapArticlesView DB ERROR: {e}')
            status = 'fail'

        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception ' + str(e)
            logging.exception(f'UserScrapArticlesView ERROR: {e}')
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


def get_article_board_data(article_list):
    '''게시글 리스트를 받아서 
    게시판 이름을 게시글 객체에 포함시키는 함수'''

    article_board = {}
    for article in article_list:
        if article.board_id not in article_board:
            board_q = Board.objects.get(id=article.board_id)
            article_board[article.board_id] = (
                board_q.name, board_q.board_type)

    for article in article_list:
        article.board_name, article.board_type = article_board[article.board_id]

    return article_list


def get_article_metas(article_list):
    # 게시글 리스트를 받아서 태그, 좋아요 수, 스크랩 수, 댓글 수를 게시글 객체에 포함시키는 함수
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
            Q(title__icontains=keyword) | Q(body__icontains=keyword) | Q(writer__user__username__icontains=keyword, anonymous_writer=False))
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

class ArticleAPIView(APIView):
    '''
    GET : 게시글 읽기 API
    URL : api/article/<int:article_id>/
    '''

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}
        article_id = kwargs.get('article_id')
        try:
            article = Article.objects.get(id=article_id)
            valid_data['article'] = article
        except Article.DoesNotExist as e:
            logging.exception(f"search_view {e}")
            errors["article_not_found"] = "해당 게시글이 존재하지않습니다."
            status = 'fail'

        return status, message, errors, valid_data

    def get(self, request, *args, **kwargs):
        # Request Validation
        status, message, errors, valid_data \
            = self.get_validation(request, *args, **kwargs)

        if status == 'fail':
            message = 'validation 과정 중 오류가 발생하였습니다.'
            logging.exception(f'ArticleAPIView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        data = {}
        try:
            article = valid_data['article']

            # 익명 또는 글쓴이가 아닌 유저가 조회할 때, 게시글 조회수 증가
            if request.user.is_anonymous or article.writer.user_id != request.user.id:
                article.view_cnt += 1
            article.save()

            # 팀 모집 게시글 확인
            if article.board.board_type == "Recruit":
                teamrecruit = TeamRecruitArticle.objects.filter(
                    article=article).first()
                if teamrecruit:
                    data['team'] = TeamSerializer(teamrecruit.team).data
            article_data = ArticleSerializer(article).data
            if request.user.is_authenticated:
                # 유저의 좋아요 여부 확인
                like = ArticleLike.objects.filter(
                    article=article_data['id'], account__user=request.user)
                article_data['marked_like'] = like.exists()
                # 유저의 스크랩 여부 확인
                scrap = ArticleScrap.objects.filter(
                    article=article_data['id'], account__user=request.user)
                article_data['marked_scrap'] = scrap.exists()

            data['article'] = article_data

            # 게시글 태그 정보
            try:
                article_tags = ArticleTag.objects.filter(article=article)
                data['tags'] = [TagIndependentSerializer(
                    article_tag.tag).data for article_tag in article_tags]
            except TagIndependent.DoesNotExist:
                data['tags'] = []

            # 게시판 정보
            board = Board.objects.get(id=article.board_id)
            data['board'] = BoardSerializer(board).data

            # 게시글 댓글 정보
            comments = ArticleComment.objects.filter(
                article_id=article.id, is_deleted=False)
            comments_data = ArticleCommentSerializer(
                comments, many=True).data

            if request.user.is_authenticated:
                # 유저의 댓글 좋아요 여부 확인
                for comment in comments_data:
                    like = ArticleCommentLike.objects.filter(
                        comment=comment['id'], account__user=request.user)
                    comment['marked_like'] = like.exists()

            data['comments'] = comments_data

            # 게시글 파일 확인

            article_file_objs = ArticleFile.objects.filter(
                article_id=article.id, status="POST")
            article_files = []
            try:
                for obj in article_file_objs:
                    article_files.append({'id': obj.id,
                                          'name': obj.filename,
                                          'file': obj.file.name,
                                          'size': convert_size(obj.file.size)})
            except Exception as e:
                logging.exception(f"저장된 파일이 없습니다.{e}")

            data['files'] = article_files
        except DatabaseError as e:
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'ArticleAPIView DB ERROR: {e}')
            status = 'fail'

        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception : ' + str(e)
            logging.exception(f'ArticleAPIView undefined ERROR : {e}')
            status = 'fail'

        # Response
        if status == 'success':
            res = {'status': status, 'message': message, 'data': data}
        else:
            res = {'status': status, 'message': message, 'errors': errors}
        return Response(res)


class ArticleCreateView(APIView):
    '''
    POST : 게시글 생성 API
    URL : api/article/create/
    '''

    def post(self, request):
        '''
        게시글 생성 API
        '''
        res = {'status': 'fail', 'message': '', 'data': None}
        try:
            # 유저 확인
            account = Account.objects.get(user=request.user)
        except:
            res['message'] = f"유저를 찾을 수 없습니다."
            return Response(res)

        try:
            # data 파싱
            title = request.data.get('title', '').strip()
            content = request.data.get('content', '').strip()
            anonymous_writer = request.data.get('anonymous_writer', False)
            anonymous_writer = convert_to_boolean(anonymous_writer)
            is_notice = request.data.get('is_notice', False)
            is_notice = convert_to_boolean(is_notice)
            board_name = request.data.get('board_name', '')

            # board name 확인
            board = Board.objects.get(name=board_name)

            # Article 생성
            article = Article.objects.create(
                title=title,
                body=content,
                pub_date=datetime.now(),
                mod_date=datetime.now(),
                anonymous_writer=anonymous_writer,
                is_notice=is_notice,
                board_id=board.id,
                writer=account)

            # 팀 모집 게시글 확인
            if article.board.board_type == "Recruit":
                # 기간 업데이트
                try:
                    # %Y-%m-%dT%H:%M:%S.%fZ 꼴로 데이터 수신
                    period_start = request.data.get('period_start', None)
                    period_end = request.data.get('period_end', None)
                    updated_article = set_article_period(
                        article, period_start, period_end)
                    if 'error' in updated_article:
                        res['message'] = updated_article['error']
                        return Response(res)
                    article = updated_article['article']
                    article.save()
                except Exception as e:
                    print("기간 업데이트 Exception:", e)
                    res['message'] = '기간을 업데이트할 수 없습니다.'
                    return Response(res)
                # 팀 게시글
                try:
                    team_id = request.data.get('team_id', 0)
                    team = Team.objects.get(id=team_id)
                    TeamRecruitArticle.objects.create(
                        team=team, article=article)
                except:
                    res['message'] = '해당 팀의 모집글을 작성할 수 없습니다.'
                    print(res['message'])
                    return Response(res)

            # 태그 생성
            article_tags = request.data.get('article_tags', [])
            if isinstance(article_tags, str):
                article_tags = json.loads(article_tags)
            for article_tag in article_tags:
                tag = TagIndependent.objects.filter(name=article_tag['value'])
                if tag.exists():
                    ArticleTag.objects.create(article=article, tag=tag.first())

            # 게시글 파일 생성
            files = request.FILES

            # 파일 게시자 추적: created_user를 username과 user_id를 연결한 이유
            # username은 변경가능하기 때문에 id로 추적하고자함
            # user가 삭제되면 user_id를 이용해 이용자를 특정하기 어렵기 때문에 username도 사용
            created_user = str(request.user.username) + \
                "_" + str(request.user.id)
            for key in files:
                print("file", key, files[key])
                ArticleFile.objects.create(
                    file=files[key],
                    filename=files[key],
                    created_user=created_user,
                    status="POST",
                    article_id=article.id)

            res['status'] = 'success'
            res['message'] = '게시글을 등록했습니다.'
            res['data'] = {'article_id': article.id}

        except Exception as e:
            logging.exception(f"게시글 쓰기 Exception:{e}")
            res['message'] = f"게시글 쓰기 Exception {e}"
            return Response(res)

        return Response(res)


class ArticleUpdateView(APIView):
    '''
    POST : 게시글 수정 API
    URL : api/article/<int:article_id>/update/
    '''

    def post(self, request, article_id):
        '''
        article id로 게시글 수정
        '''
        res = {'status': 'fail', 'message': '', 'data': None}
        try:
            # article 존재 확인
            article = Article.objects.get(id=article_id)
        except Exception as e:
            res['message'] = '게시글을 찾을 수 없습니다.'
            return Response(res)
        try:
            # 유저 확인
            if request.user.id != article.writer.user.id:
                res['message'] = '수정 권한이 없습니다.'
                return Response(res)
            # data 파싱
            print('update', request.data)
            title = request.data.get('title', '').strip()
            content = request.data.get('content', '').strip()
            anonymous_writer = request.data.get('anonymous_writer', False)
            anonymous_writer = convert_to_boolean(anonymous_writer)
            is_notice = request.data.get('is_notice', False)
            is_notice = convert_to_boolean(is_notice)

            # 게시글 내용 업데이트
            article.title = title
            article.body = content
            article.mod_date = datetime.now()
            article.anonymous_writer = anonymous_writer
            article.is_notice = is_notice
            if not article.board.anonymous_writer:
                article.anonymous_writer = False
            article.save()

            # 팀 모집 게시판의 경우 모집 기간 업데이트
            if article.board.board_type == "Recruit":
                try:
                    # %Y-%m-%dT%H:%M:%S.%fZ 꼴로 데이터 수신
                    period_start = request.data.get('period_start', None)
                    period_end = request.data.get('period_end', None)
                    updated_article = set_article_period(
                        article, period_start, period_end)
                    if 'error' in updated_article:
                        res['message'] = updated_article['error']
                        return Response(res)
                    article = updated_article['article']
                    article.save()
                except Exception as e:
                    logging.exception(f"기간 업데이트 Exception:{e}")
                    res['message'] = '기간을 업데이트할 수 없습니다.'
                    return Response(res)
                # 팀 게시글
                try:
                    team_id = request.data.get('team_id', 0)
                    team = Team.objects.get(id=team_id)
                    team_recruit_article = TeamRecruitArticle.objects.get(
                        article=article)
                    team_recruit_article.team = team
                    team_recruit_article.save()
                except Exception as e:
                    res['message'] = '해당 모집글의 팀을 수정할 수 없습니다.'
                    logging.exception(f"{res['message']} {e}")
                    print(res['message'])
                    return Response(res)

            # 게시글 태그 삭제 후 재생성
            old_article_tags = ArticleTag.objects.filter(
                article__id=article.id)
            for old_article_tag in old_article_tags:
                old_article_tag.delete()

            article_tags = request.data.get('article_tags', [])
            if isinstance(article_tags, str):
                article_tags = json.loads(article_tags)
            for article_tag in article_tags:
                tag = TagIndependent.objects.filter(name=article_tag['value'])
                if tag.exists():
                    ArticleTag.objects.create(article=article, tag=tag.first())

            article_files = ArticleFile.objects.filter(
                article_id=article.id, status="POST")
            files = request.FILES
            file_id_list = request.data.get('file_id_list', None)
            created_user = str(request.user.username) + \
                "_" + str(request.user.id)

            # 제거한 파일을 DELETE 상태로 변경
            existing_files = []
            for obj in article_files:
                # 기존 등록한 파일은 id 값으로 request를 받아 체크할 수 있음
                # 기존 등록한 파일의 id 값이 오지 않은 경우 삭제된 것으로 간주하고 삭제 처리
                if str(obj.id) not in file_id_list:
                    ArticleFile.objects.filter(id=obj.id).update(
                        status='DELETE', updated_date=datetime.now())
                # else:
                #    existing_files.append(str(obj.id))

            # 새로 업로드한 파일을 POST상태로 create
            for key in files:
                # if key not in existing_files:
                ArticleFile.objects.create(
                    file=files[key],
                    filename=files[key],
                    created_user=created_user,
                    status="POST",
                    article_id=article.id)

            res['status'] = 'success'
            res['message'] = '게시글을 수정했습니다.'
            res['data'] = {'article_id': article.id}
            return Response(res)
        except Exception as e:
            print("ArticleAPIView", e)
            res['message'] = e
            return Response(res)


class ArticleDeleteView(APIView):
    '''
    POST : 게시글 삭제 API
    URL : api/article/<int:article_id>/delete/
    '''

    def post(self, request, article_id):
        '''
        article id로 게시글 수정
        '''
        res = {'status': 'fail', 'message': '', 'data': None}
        print(article_id)
        try:
            # article 존재 확인
            article = Article.objects.get(id=article_id)
        except Exception as e:
            res['message'] = '게시글을 찾을 수 없습니다.'
            return Response(res)
        try:
            with transaction.atomic():
                # 유저 확인
                if request.user.id != article.writer.user.id:
                    res['message'] = '삭제 권한이 없습니다.'
                    return Response(res)

                # 팀 모집 게시판의 경우 팀-게시글 관계 삭제
                if article.board.board_type == "Recruit":
                    # 팀 게시글
                    try:
                        team_recruit_article = TeamRecruitArticle.objects.get(
                            article=article)
                        team_recruit_article.delete()
                    except:
                        res['message'] = '해당 모집글에는 팀이 설정되지 않았습니다.'
                        print(res['message'])
                        return Response(res)

                # 게시글 태그 삭제
                old_article_tags = ArticleTag.objects.filter(
                    article__id=article.id)
                for old_article_tag in old_article_tags:
                    old_article_tag.delete()

                article_tags = ArticleTag.objects.filter(article=article)
                for article_tag in article_tags:
                    article_tag.delete()
                # 파일 삭제처리
                ArticleFile.objects.filter(article_id=article.id).update(
                    status="DELETE", updated_date=datetime.now())
                article.delete()

                # 게시글 스크랩 삭제처리
                article_scraps = ArticleScrap.objects.filter(article=article)
                for article_scrap in article_scraps:
                    article_scrap.delete()

                res['status'] = 'success'
                res['message'] = '게시글을 삭제했습니다.'
                res['data'] = {'article_id': article.id}
                return Response(res)

        except Exception as e:
            print("ArticleDeleteView", e)
            res['message'] = e
            return Response(res)


class ArticleLikeView(APIView):
    def get(self, request, article_id):
        res = {'status': 'success', 'message': '', 'data': None}
        data = {'like_cnt': 0}
        like_cnt = len(ArticleLike.objects.filter(article__id=article_id))
        data['like_cnt'] = like_cnt
        res['data'] = data
        return Response(res)

    def post(self, request, article_id):
        res = {'status': 'fail', 'message': '', 'data': None}
        data = {'like_cnt': 0}

        try:
            article = Article.objects.get(id=article_id)
            account = Account.objects.get(user=request.user)

            if article.writer.user_id == request.user.id:
                # 작성자가 추천한 경우
                res['message'] = "자신의 게시글은 추천할 수 없습니다."
                return Response(res)

            article_like, created = ArticleLike.objects.get_or_create(
                article=article, account=account)

            if not created:
                # 이미 추천한 게시글인 경우
                article_like.delete()
                res['message'] = "추천 취소"
            like_cnt = len(ArticleLike.objects.filter(article=article))
            data['marked_like'] = created
            data['like_cnt'] = like_cnt
            res['data'] = data
            res['status'] = 'success'
            return Response(res)

        except Exception as e:
            res['message'] = "오류가 발생했습니다."
            print("ArticleLikeView", e)
            return Response(res)


class ArticleScrapView(APIView):
    def get(self, request, article_id):
        res = {'status': 'success', 'message': '', 'data': None}
        data = {'scrap_cnt': 0}
        scrap_cnt = len(ArticleScrap.objects.filter(article__id=article_id))
        data['scrap_cnt'] = scrap_cnt
        res['data'] = data
        return Response(res)

    def post(self, request, article_id):
        res = {'status': 'success', 'message': '', 'data': None}
        data = {'scrap_cnt': 0}

        article = Article.objects.get(id=article_id)
        account = Account.objects.get(user=request.user)
        article_scrap, created = ArticleScrap.objects.get_or_create(
            article=article, account=account)

        if not created:
            # 이미 스크랩한 게시글인 경우
            article_scrap.delete()
            res['message'] = "스크랩 취소"
        scrap_cnt = len(ArticleScrap.objects.filter(article=article))
        data['marked_scrap'] = created
        data['scrap_cnt'] = scrap_cnt
        res['data'] = data
        res['status'] = 'success'
        return Response(res)


class ArticleFileView(APIView):
    '''
    GET : 
    article_id 와 file_id를 받아서 파일을반환하는 API
    article_id 와 file_id가 서로 매치가 안되면 fail
    team_article 인데 팀원이 아니면 fail
    URL : api/article/<int:article_id>/file/<int:articlefile_id>
    '''

    def get_validation(self, request, *args, **kwargs):
        status = 'success'
        message = ''
        errors = {}
        valid_data = {}

        user = request.user
        article_id = kwargs.get('article_id')
        articlefile_id = kwargs.get('articlefile_id')

        try:
            article = Article.objects.get(id=article_id)
            if article.board.board_type == 'Team':
                if not request.user.is_authenticated:
                    errors["require_login"] = "팀게시판에 접근하기 위해서는 로그인이 필요합니다."
                    status = 'fail'
                    return status, message, errors, valid_data
                if not is_teammember(article.board.team.id, user.id):
                    errors["user_is_not_teammember"] = "해당 팀의 멤버가 아닙니다. "
                    status = 'fail'
                    return status, message, errors, valid_data

            articlefile = ArticleFile.objects.get(id=articlefile_id)

            valid_data['articlefile'] = articlefile

        except Article.DoesNotExist:
            errors["article_not_found"] = "해당 게시글이 존재하지않습니다."
            status = 'fail'
        except ArticleFile.DoesNotExist:
            errors["articlefile_not_found"] = "해당 게시글파일이 존재하지않습니다."
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
            logging.debug(f'ArticleFielView validation error')
            res = {'status': status, 'message': message, 'errors': errors}
            return Response(res)

        # Transactions
        data = {}
        try:
            articlefile = valid_data['articlefile']
            file_path = os.path.join(MEDIA_ROOT, str(articlefile.file))
            data['articlefile'] = open(file_path, 'rb')

        except DatabaseError as e:
            errors['DB_exception'] = 'DB Error'
            logging.exception(f'ArticleFileView DB ERROR: {e}')
            status = 'fail'

        except Exception as e:
            errors['undefined_exception'] = 'undefined_exception : ' + \
                str(e)
            logging.exception(f'ArticleFileView undefined ERROR: {e}')
            status = 'fail'

        # Response
        return FileResponse(data['articlefile'])


class CommentCreateView(APIView):
    '''
    POST: 게시글에 댓글 생성
    URL: api/comment/create/
    '''

    def post(self, request):
        res = {'status': 'success', 'message': '', 'data': None}
        data = {'comment': None}
        try:
            with transaction.atomic():
                # data 파싱
                content = request.data.get('content', '').strip()
                anonymous_writer = request.data.get('anonymous_writer', False)
                anonymous_writer = convert_to_boolean(anonymous_writer)
                article_id = request.data.get('article_id', 0)

                writer = Account.objects.get(user=request.user.id)
                article = Article.objects.get(id=article_id)
                now_date = datetime.now()
                article_comment = ArticleComment.objects.create(
                    article=article,
                    body=content,
                    pub_date=now_date,
                    del_date=now_date,
                    anonymous_writer=anonymous_writer,
                    writer=writer
                )
                res['message'] = "등록이 완료되었습니다!"
                data['comment'] = ArticleCommentSerializer(
                    article_comment).data
                res['data'] = data
        except Exception as e:
            res['status'] = 'fail'
            res['message'] = '댓글을 등록할 수 없습니다.'
            print("CommentCreateView error", e)

        return Response(res)


class CommentDeleteView(APIView):
    '''
    POST: 댓글 삭제 이후 해당 게시글의 댓글 리스트 반환
    URL: api/comment/<int:comment_id>/delete/
    '''

    def post(self, request, comment_id):
        res = {'status': 'fail', 'message': '', 'data': None}
        data = {'comments': None}
        try:
            with transaction.atomic():

                article_comment = ArticleComment.objects.filter(
                    id=comment_id, is_deleted=False)
                if not article_comment.exists():
                    res['message'] = '해당 댓글이 존재하지 않습니다.'
                    return Response(res)
                article_comment = article_comment.first()
                if not article_comment.writer.user == request.user:
                    res['message'] = '작성자만 삭제할 수 있습니다.'
                    return Response(res)

                # comment.delete()
                article_comment.del_date = datetime.now()
                article_comment.is_deleted = True
                article_comment.save()

                # 게시글 댓글 리스트 반환
                article = Article.objects.get(id=article_comment.article.id)
                comments = ArticleComment.objects.filter(
                    article_id=article.id, is_deleted=False)
                data['comments'] = ArticleCommentSerializer(
                    comments, many=True).data

                res['data'] = data
                res['status'] = 'success'
                res['message'] = "삭제했습니다."

        except Exception as e:
            res['message'] = '댓글을 삭제할 수 없습니다.'
            print("CommentDeleteView error", e)

        return Response(res)


class CommentLikeView(APIView):
    '''
    댓글 좋아요
    '''

    def get(self, request, comment_id):
        res = {'status': 'success', 'message': '', 'data': None}
        data = {'like_cnt': None}
        like_cnt = len(ArticleCommentLike.objects.filter(
            comment__id=comment_id))
        data['like_cnt'] = like_cnt
        res['data'] = data
        return Response(res)

    def post(self, request, comment_id):
        res = {'status': 'fail', 'message': '', 'data': None}
        data = {'like_cnt': None}
        try:
            with transaction.atomic():

                account = Account.objects.get(user=request.user.id)
                article_comment = ArticleComment.objects.filter(
                    id=comment_id, is_deleted=False)
                if not article_comment.exists():
                    res['message'] = '해당 댓글이 존재하지 않습니다.'
                    return Response(res)
                article_comment = article_comment.first()

                if article_comment.writer.user_id == request.user.id:
                    # 작성자가 추천한 경우
                    res['message'] = '본인의 댓글은 추천할 수 없습니다.'
                    return Response(res)
                comment_like, created = ArticleCommentLike.objects.get_or_create(
                    comment=article_comment, account=account)
                if not created:
                    comment_like.delete()
                    res['message'] = '댓글 추천 취소'

                like_cnt = len(ArticleCommentLike.objects.filter(
                    comment=article_comment))
                data['like_cnt'] = like_cnt

                res['data'] = data
                res['status'] = 'success'

        except Exception as e:
            res['message'] = '댓글을 추천할 수 없습니다.'
            print("CommentLikeView error", e)

        return Response(res)


class ArticleCommentsView(APIView):
    '''
    GET: 게시글의 댓글 리스트 API
    URL: api/article/<int:article_id>/comments/
    '''

    def get(self, request, article_id):
        res = {'status': 'success', 'message': '', 'data': None}
        data = {'comments': None}
        # 게시글 댓글 정보
        comments = ArticleComment.objects.filter(
            article_id=article_id, is_deleted=False)

        data['comments'] = ArticleCommentSerializer(
            comments, many=True).data

        # 유저의 좋아요 여부 확인
        for comment in data['comments']:
            like = ArticleCommentLike.objects.filter(
                comment=comment['id'], account__user=request.user)
            comment['marked_like'] = like.exists()
        res['data'] = data
        return Response(res)


def set_article_period(article: Article, period_start: str, period_end: str):
    ret = {"article": article}
    datetime_start = datetime.strptime(
        period_start, "%Y-%m-%dT%H:%M:%S.%fZ")
    datetime_end = datetime.strptime(
        period_end, "%Y-%m-%dT%H:%M:%S.%fZ")

    # 1시간 조건
    condition_hours = 1
    if datetime_end-datetime_start < timedelta(hours=condition_hours):
        ret['error'] = f'모집기간이 너무 짧습니다. {condition_hours} 시간 이상으로 설정해주세요.'
        return ret

    # 'T' and 'Z' 문자삭제, %Y-%m-%d %H:%M:%S.%f 꼴로 데이터 변환
    period_start = datetime_start.replace(tzinfo=None)
    period_end = datetime_end.replace(tzinfo=None)

    if period_start and period_end:
        article.period_start = period_start
        article.period_end = period_end
    else:
        ret['error'] = '입력값에 오류가 있어 기간을 업데이트할 수 없습니다.'
        return ret

    # 게시 기간 설정된 Article 객체 반환
    return ret