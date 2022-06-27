from django.urls import path, include

from user import views

app_name = 'user'
urlpatterns = [
    path('<int:username>/', views.ProfileView.as_view(), name='profile'),
    path('<int:username>/profile-edit/', views.ProfileEditView.as_view(), name='profile-edit')
]