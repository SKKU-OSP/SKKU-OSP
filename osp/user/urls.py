from django.urls import path, include

from user import views

app_name = 'user'
urlpatterns = [
    path('<int:student_id>/', views.student_id_to_username, name='profile'),
    path('<username>/', views.ProfileView.as_view(), name='profile'),
    path('<username>/profile-edit/', views.ProfileEditView.as_view(), name='profile-edit'),
    path('<username>/profile-edit/interestsupdate', views.load_interests_data, name='interestsupdate'),
    path('<username>/profile-edit/languageupdate', views.load_language_data, name='languageupdate'),
    path('<username>/profile-edit/imgupdate', views.load_img_data, name='imgupdate'),
    path('<username>/profile-edit/save_all', views.save_all, name='save_all'),
    path('<username>/comparestat', views.compare_stat, name='comparestat'),
    path('<username>/repo', views.ProfileRepoView.as_view(), name='repo'),
    path('<username>/repo-overview', views.load_repo_data, name='repo-overview'),
    path('<username>/test', views.ProfileType.as_view(), name='test'),
    path('<username>/testresult', views.save_test_result, name='testresult'),
]
