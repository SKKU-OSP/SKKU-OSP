from community import views, views_article
from django.urls import path

app_name = 'community'

urlpatterns = [
    # 게시판
    path('api/board/<str:board_name>/',
         views.TableBoardView.as_view(), name='board'),
    # 게시글 조회
    path('api/article/<int:article_id>/',
         views_article.ArticleAPIView.as_view(), name='ArticleAPI'),
    # 게시글 수정
    path('api/article/<int:article_id>/update/',
         views_article.ArticleUpdateView.as_view(), name='ArticleUpdate'),
    # 게시글 생성
    path('api/article/create/',
         views_article.ArticleCreateView.as_view(), name='ArticleCreate'),
    # 게시글 삭제
    path('api/article/<int:article_id>/delete/',
         views_article.ArticleDeleteView.as_view(), name='ArticleDelete'),
    # 게시글 좋아요
    path('api/article/<int:article_id>/like/',
         views_article.ArticleLikeView.as_view(), name='ArticleLike'),
    # 게시글 스크랩
    path('api/article/<int:article_id>/scrap/',
         views_article.ArticleScrapView.as_view(), name='ArticleScrap'),
    # 게시글 파일
    path('api/article/<int:article_id>/file/<int:articlefile_id>',
         views_article.ArticleFileView.as_view(), name='ArticleFile'),
    # 댓글 생성
    path('api/comment/create/',
         views_article.CommentCreateView.as_view(), name='CommentCreate'),
    # 댓글 삭제
    path('api/comment/<int:comment_id>/delete/',
         views_article.CommentDeleteView.as_view(), name='CommentDelete'),
    # 댓글 좋아요
    path('api/comment/<int:comment_id>/like/',
         views_article.CommentLikeView.as_view(), name='CommentLike'),

    # 유저가 쓴 게시글 목록
    path('api/user-articles/',
         views.UserArticlesView.as_view(), name='user-articles'),
    # 유저가 쓴 댓글 목록
    path('api/user-comments/',
         views.UserCommentsView.as_view(), name='user-comments'),
    # 유저가 스크랩한 글 목록
    path('api/user-scrap-articles/',
         views.UserScrapArticlesView.as_view(), name='user-scrap-articles'),
    # 게시글 검색
    path('search/', views.SearchView.as_view(), name='Search'),

    ### 미사용 패턴 ###
    # 댓글 조회
    path('api/article/<int:article_id>/comments/',
         views_article.ArticleCommentsView.as_view(), name='ArticleComments'),
    # 메인 페이지
    path('api/main/', views.CommunityMainView.as_view(), name='main'),
    path('api/board/notice/', views.NoticeView.as_view(), name='notice'),
    path('board/notice-save/',
         views.ArticleNoticeSaveView.as_view(), name='notice-save'),
]
