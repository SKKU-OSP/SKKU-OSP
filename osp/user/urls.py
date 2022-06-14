from django.urls import path, include

from . import views

app_name = 'user'

urlpatterns = [
    path('<int:user_id>/', views.ProfileView.as_view(), name='profile'),
]