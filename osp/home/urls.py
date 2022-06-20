from django.urls import path
from home import views


from .views import statistic

urlpatterns = [
  path('statistic/', statistic, name='statistic'),
]