from django.urls import path
from common import views
from django.contrib.auth import views as auth_views

app_name = 'common'

urlpatterns = [
  path('login/', views.LoginView.as_view(), name='login'),
  path('logout/', auth_views.LogoutView.as_view(), name='logout'),
  path('register/', views.register_page, name='signup'),
  path('register/checkuser', views.check_user, name='check_user'),
  path('register/checkgithub', views.check_github_id, name='check_github_id'),
  path('password_reset/', views.PasswordResetView.as_view(), name="password_reset"),
  path('password_reset/done/', views.PasswordResetDoneView.as_view(), name="password_reset_done"),
  path('reset/<uidb64>/<token>/', views.PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
  path('reset/done/', views.PasswordResetCompleteView.as_view(), name="password_reset_complete"),
]
