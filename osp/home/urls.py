from django.urls import path
from home import views

urlpatterns = [
  path('statistic/', views.statistic, name='statistic'),
]