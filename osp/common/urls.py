from django.urls import path
from common import views
from django.contrib.auth import views as auth_views

app_name = 'common'

urlpatterns = [
  path('login/', auth_views.LoginView.as_view(template_name='common/login.html'), name='login'),
  path('logout/', auth_views.LogoutView.as_view(template_name='common/logout.html'), name='logout'),
  path('register/', views.register_page, name='signup'),
  path('register/checkuser', views.check_user, name='check_user'),
  path('register/checkgithub', views.check_github_id, name='check_github_id'),
]