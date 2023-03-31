from django.urls import path, include

from user import views, views_edit

app_name = 'user'
urlpatterns = [
    # 학생 id로 접속시도하면 /user/{username} 으로 리다이렉트
    path('<int:student_id>/', views.student_id_to_username, name='profile'),
    
    # 프로필화면
    path('<username>/', views.ProfileView.as_view(), name='profile'),

    # 프로필수정 화면
    path('<username>/profile-edit/', views_edit.ProfileEditView.as_view(), name='profile-edit'),
    path('<username>/profile-edit/interests', views_edit.ProfileInterestsView.as_view(), name='interestsupdate'),
    path('<username>/profile-edit/languages', views_edit.ProfileLanguagesView.as_view(), name='languagesupdate'),
    path('<username>/profile-edit/image', views_edit.ProfileImageView.as_view(), name='imgupdate'),
    path('<username>/profile-edit/imagedefault', views_edit.ProfileImageDefaultView.as_view(), name='imgupdatedefault'),
    path('<username>/profile-edit/all', views_edit.ProfileEditSaveView.as_view(), name='save_all'),
    path('<username>/profile-edit/passwd', views_edit.ProfilePasswdView.as_view(), name='change_passwd'),

    path('<username>/comparestat', views.compare_stat, name='comparestat'),

    path('<username>/repo', views.ProfileRepoView.as_view(), name='repo'),
    path('<username>/repo-overview', views.load_repo_data, name='repo-overview'),

    path('<username>/test', views.ProfileType.as_view(), name='test'),
    path('<username>/testresult', views.save_test_result, name='testresult'),

    path('<username>/api/consent-write', views.consent_write, name='consent_write'),
    path('<username>/api/consent-open', views.consent_open, name='consent_open'),
]
