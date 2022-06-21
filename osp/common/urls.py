from re import template
from django.urls import path
from common import views
from django.contrib.auth import views as auth_views

urlpatterns = [
  path('login/', auth_views.LoginView.as_view(template_name='common/login.html'), name='login'),
  path('logout/', auth_views.LogoutView.as_view(template_name='common/logout.html'), name='logout'),
  path('register/', views.register_page, name='logout'),
]