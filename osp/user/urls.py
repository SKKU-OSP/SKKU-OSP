from django.urls import path, include

from user import views

app_name = 'user'
urlpatterns = [
    path('<int:student_id>/', views.student_id_to_username, name='profile'),
    path('<username>/', views.ProfileView.as_view(), name='profile'),
    path('<username>/profile-edit/', views.ProfileEditView.as_view(), name='profile-edit')
]