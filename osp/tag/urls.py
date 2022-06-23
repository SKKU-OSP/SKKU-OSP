from django.urls import path
from tag import views

urlpatterns = [
    path('api/', views.TagAPIView.as_view(), name='tag-api'),
]