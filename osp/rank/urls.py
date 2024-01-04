from django.urls import path

from rank import views

app_name = "rank"

urlpatterns = [
    # React
    path("api/user/", views.UserRanking.as_view(), name="UserRanking"),
    path("api/repo/", views.RepoRanking.as_view(), name="RepoRanking"),
    path("api/contrib/", views.RepoContrib.as_view(), name="RepoContrib"),

    # Django
    path("user", views.user_rank, name="user_rank"),
    path("repo", views.repo_rank, name="repo_rank"),
    path("repo/api", views.repo_api, name="repo_api"),
]
