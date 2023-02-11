from django.urls import path, include

from community import views, views_api, views_legacy

app_name = 'community'

urlpatterns = [
    path('', views.CommunityMainView.as_view(), name='Community-Main'),
    path('redirect/', views.redirectView.as_view(), name='RedirectView'),
    path('board/<board_name>/<board_id>/', views.TableBoardView.as_view(), name='Board'),
    path('board/<board_name>/<board_id>/save/', views.ArticleSaveView.as_view(), name='article-save'),

    path('activity/', views.my_activity, name='Activity'),
    path('recommender/user/', views.user_board, name='user-board'),
    path('article-list/<board_name>/<board_id>/', views.article_list ,name='Article_List'),
    path('account-cards/', views.account_cards ,name='Account_Cards'),


    path('article/<article_id>/', views.ArticleView.as_view(), name='article-view'),


    path('api/article/create/', views_api.article_create, name='article-c'),
    path('api/article/update/', views_api.article_update, name='article-u'),
    path('api/article/delete/', views_api.article_delete, name='article-d'),


    path('api/article/like/', views_api.article_like, name='article-like'),
    path('api/article/scrap/', views_api.article_scrap, name='article-scrap'),

    path('api/comment/create/', views_api.comment_create, name='comment-c'),
    path('api/comment/delete/', views_api.comment_delete, name='comment-d'),
    path('api/comment/like/', views_api.comment_like, name='comment-like'),

    path('legacy-board/<board_name>/<board_id>/', views_legacy.board, name='LegacyBoard'),
    path('legacy-board/<board_name>/<board_id>/save/', views.ArticleSaveView.as_view(), name='legacy-article-save'),

    # path('add/', views.TeamView.as_view(), name='Team'),
]
