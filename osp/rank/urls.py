from django.urls import path
from rank import views

app_name = "rank"

urlpatterns = [
    path("user", views.user_rank, name="user_rank"),
    path("repo", views.repo_rank, name="repo_rank"),
]