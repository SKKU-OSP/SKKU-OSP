from django.urls import path

from community import views, views_api, views_article

app_name = 'community'

urlpatterns = [
    path('', views.CommunityMainView.as_view(), name='main'),
    path('redirect/', views.redirectView.as_view(), name='RedirectView'),
    path('board/<board_name>/<board_id>/',
         views.TableBoardView.as_view(), name='Board'),
    path('board/<board_name>/<board_id>/save/',
         views.ArticleSaveView.as_view(), name='article-save'),
    path('board/notice/', views.NoticeView.as_view(), name='notice-board'),
    path('board/notice-save/',
         views.ArticleNoticeSaveView.as_view(), name='notice-save'),

    path('search/', views.SearchView.as_view(), name='Search'),

    path('activity/', views.activity_board, name='Activity'),
    path('activity/contents/', views.my_activity, name='Activity_List'),
    path('recommender/user/', views.UserBoardView.as_view(), name='user-board'),
    path('article-list/<board_name>/<board_id>/',
         views.article_list, name='Article_List'),
    path('account-cards/', views.account_cards, name='Account_Cards'),

    path('article/<article_id>/', views.ArticleView.as_view(), name='article-view'),
    path('article/<article_id>/download/file/<file_id>',
         views_api.file_download, name='file-download'),

    path('api/article/like/', views_api.article_like, name='article-like'),
    path('api/article/scrap/', views_api.article_scrap, name='article-scrap'),
    path('api/article/image/', views_api.upload_article_image, name='article-image'),

    path('api/comment/delete/', views_api.comment_delete, name='comment-d'),
    path('api/comment/like/', views_api.comment_like, name='comment-like'),


    path('api/article/create/',
         views_article.ArticleCreateView.as_view(), name='ArticleCreate'),
    path('api/article/<int:article_id>/',
         views_article.ArticleAPIView.as_view(), name='ArticleAPI'),
    path('api/article/<int:article_id>/update/',
         views_article.ArticleUpdateView.as_view(), name='ArticleUpdate'),
    path('api/article/<int:article_id>/delete/',
         views_article.ArticleDeleteView.as_view(), name='ArticleDelete'),
    path('api/article/<int:article_id>/like/',
         views_article.ArticleLikeView.as_view(), name='ArticleLike'),
    path('api/article/<int:article_id>/scrap/',
         views_article.ArticleScrapView.as_view(), name='ArticleScrap'),
    path('api/article/<int:article_id>/comments/',
         views_article.ArticleCommentsView.as_view(), name='ArticleComments'),
    path('api/comment/create/',
         views_article.CommentCreateView.as_view(), name='CommentCreate'),
    path('api/comment/<int:comment_id>/delete/',
         views_article.CommentDeleteView.as_view(), name='CommentDelete'),
    path('api/comment/<int:comment_id>/like/',
         views_article.CommentLikeView.as_view(), name='CommentLike')
]
