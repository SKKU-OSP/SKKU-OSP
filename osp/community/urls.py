from django.urls import path, include

from community import views

app_name = 'community'

urlpatterns = [
    path('', views.main, name='Community-Main'),
    path('<board_name>/<board_id>/', views.board, name='Board'),
    path('article-list/<board_name>/<board_id>/', views.article_list ,name='Article_List'),
    path('<board_name>/<board_id>/register_article/', views.ArticleRegisterView.as_view(), name='article-register'),
    path('article/<article_id>/', views.ArticleView.as_view(), name='article-view'),

    path('article/create/', views.article_create, name='article-c'),
    path('article/update/', views.article_update, name='article-u'),
    path('article/delete/', views.article_delete, name='article-d'),

    path('comment/create/', views.comment_create, name='comment-c'),
    path('comment/delete/', views.comment_delete, name='comment-d'),

    # path('add/', views.TeamView.as_view(), name='Team'),
]