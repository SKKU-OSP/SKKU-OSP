from django.urls import path

from home.views import statistic, update_score

app_name = 'home'

urlpatterns = [
  path('statistic/', statistic, name='statistic'),
  path('update_score/', update_score, name='update_score'),
]
