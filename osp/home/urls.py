from django.urls import path

from home import views

app_name = 'home'

urlpatterns = [
    path('update_score/', views.update_score, name='update_score'),
    path('api/statistic/', views.StatisticView.as_view(), name='Statistic'),
    path('api/update_github/', views.GithubUpdateView.as_view(), name='update-owner'),

    # Django만으로 열람이 가능하도록 Redundant하게 남겨둠
    path('statistic/', views.statistic, name='statistic'),
]
