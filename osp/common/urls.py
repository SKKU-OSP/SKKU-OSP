from django.contrib.auth import views as auth_views
from django.urls import path

from common import views, views_legacy

app_name = 'common'

urlpatterns = [
    # REACT 관련 로그인 View
    # FOR JWT
    path('login/github/callback/', views.GitHubLoginView.as_view(),
         name='github_login_callback'),
    path('login/sso/', views.SSOLoginView.as_view(), name="SSOLogin"),
    path('login/user/', views.JWTLoginView.as_view(), name="JWTLogin"),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('signup/', views.SignUpView.as_view(), name="SignUp"),
    path('register/checkuser/', views.CheckUserView.as_view(), name='check_user'),
    # path('register/checkgithub/', views.CheckGithubIdView.as_view(),
    #      name='check_github_id'),
    # path('register/checkstudent/', views.CheckStudentIdView.as_view(),
    #      name='check_student_id'),
    path('find-account/', views.AccountFinderView.as_view(), name="AccountFinder"),
    path('password-reset/', views.PasswordResetSendView.as_view(),
         name="PasswordResetSend"),
    path('reset/<uidb64>/<token>/', views.PasswordResetConfirmView.as_view(),
         name="password_reset_confirm"),
    path('github_id/change/', views.GithubIdChangeView.as_view(), name='id_change'),


    # LEGACY: Django 관련 로그인 View
    path('login/', views_legacy.LoginView.as_view(), name='login'),
    # FOR SESSIONS
    # path('login/github/callback/', views_legacy.github_login_callback, name='github_login_callback'),
    path('register/', views_legacy.register_page, name='signup'),
    path('find_account/', views_legacy.AccountFindView.as_view(), name="find_account"),
    path('find_account/done/', views_legacy.AccountFindDoneView.as_view(),
         name="find_account_done"),
    path('password_reset/', views_legacy.PasswordResetView.as_view(),
         name="password_reset"),
    path('password_reset/done/', views_legacy.PasswordResetDoneView.as_view(),
         name="password_reset_done"),
    path('reset/done/', views_legacy.PasswordResetCompleteView.as_view(),
         name="password_reset_complete"),
    path('api/v1/find_account', views_legacy.valid_check, name="api_find_account"),

]
