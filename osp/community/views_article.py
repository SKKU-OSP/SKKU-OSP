from django.db import transaction
from django.db.models import Count
from django.http import FileResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction, DatabaseError
from community.models import *
from community.utils import convert_size, convert_to_boolean
from community.serializers import BoardSerializer, ArticleSerializer, ArticleCommentSerializer
from tag.serializers import TagIndependentSerializer
from team.serializers import TeamSerializer
from team.models import TeamMember
from team.utils import is_teammember
from datetime import datetime, timedelta
from osp.settings import MEDIA_URL, MEDIA_ROOT
import logging
import json
import os


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
