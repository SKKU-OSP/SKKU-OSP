from django.urls import path, include

from user import views

app_name = 'user'

urlpatterns = [
    path('<int:student_id>/', views.ProfileView.as_view(), name='profile'),
]