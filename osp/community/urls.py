from django.urls import path, include
from community import views

app_name = 'community'

urlpatterns = [
    path('', views.main, name='Community-Main'),
    path('<board_name>/', views.board, name='Board'),
]