from django.urls import path
from tag import views

urlpatterns = [
    path('language/', views.LanguageTagView.as_view(), name='language-api'),
]