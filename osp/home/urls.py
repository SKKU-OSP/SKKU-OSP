from django.urls import path
from home import views


from .views import statistic

app_name = 'home'

urlpatterns = [
  path('statistic/', statistic, name='statistic'),
]