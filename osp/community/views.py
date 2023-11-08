import logging
import math

from django.core.paginator import Paginator
from django.db import DatabaseError
from django.db.models import Count, F, OuterRef, Q, Subquery
from django.urls import reverse
from rest_framework.response import Response
from rest_framework.views import APIView

from community.models import *
from community.serializers import (ArticleCommentSerializer, ArticleSerializer,
                                   BoardArticleSerializer, BoardSerializer,
                                   RecruitArticleSerializer)
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
            message = 'validation 과정 중 오류가 발생하였습니다.'
            print(errors)
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

                if teaminvitemessage.exists():
                    # 팀 멤버라면 초대 상태 리셋
                    data['is_invited_user'] = False

                elif teaminvitemessage.exists():
                    # 초대 상태로 설정
                    data['is_invited_user'] = True

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
