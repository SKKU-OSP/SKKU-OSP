from django.urls import path
from common import views
from django.contrib.auth import views as auth_views

app_name = 'common'

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    # FOR SESSIONS
    #   path('login/github/callback/', views.github_login_callback, name='github_login_callback'),
    # FOR JWT
    path('login/github/callback/', views.GitHubLoginView.as_view(),
         name='github_login_callback'),
    path('login/user/', views.JWTLoginView.as_view(), name="JWTLogin"),
    path('signup/', views.SignUpView.as_view(), name="SignUp"),

    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('register/', views.register_page, name='signup'),
    path('register/checkuser', views.check_user, name='check_user'),
    path('register/checkgithub', views.check_github_id, name='check_github_id'),
    path('register/checkstudent', views.check_student_id, name='check_student_id'),

    path('find_account/', views.AccountFindView.as_view(), name="find_account"),
    path('find_account/done/', views.AccountFindDoneView.as_view(),
         name="find_account_done"),

    path('password_reset/', views.PasswordResetView.as_view(), name="password_reset"),
    path('password_reset/done/', views.PasswordResetDoneView.as_view(),
         name="password_reset_done"),
    path('reset/<uidb64>/<token>/', views.PasswordResetConfirmView.as_view(),
         name="password_reset_confirm"),
    path('reset/done/', views.PasswordResetCompleteView.as_view(),
         name="password_reset_complete"),
    path('api/v1/find_account', views.valid_check, name="api_find_account"),
    path('api/email-domain', views.EmailDomainListView.as_view(),
         name="EmailDomainList"),
]
