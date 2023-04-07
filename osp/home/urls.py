from django.urls import path
from home import views


from .views import statistic, update_score

app_name = 'home'

urlpatterns = [
  path('statistic/', statistic, name='statistic'),
  path('update_score/', update_score, name='update_score'),
]
