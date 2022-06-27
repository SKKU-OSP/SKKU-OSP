from django.urls import path, include
from community import views

app_name = 'community'

urlpatterns = [
    path('<board_name>/', views.board, name='Board'),
]