from django.urls import path

from user import views

app_name = 'user'
urlpatterns = [
     # REACT 관련 View
     path('api/info/', views.UserAccountView.as_view(), name='UserAccount'),
     path('api/guideline/<username>/',
          views.GuidelineView.as_view(), name='guideline'),
     path('api/tag/<username>/', views.UserInterestTagListView.as_view(),
          name='UserInterestTagList'),
     path('api/interests/update/',
          views.UserInterestTagUpdateView.as_view(), name='UserInterestTagUpdate'),
     path('api/langs/update/',
          views.UserLangTagUpdateView.as_view(), name='UserLangTagUpdate'),
     path('api/profile-activity/<username>/',
          views.ProfileActivityView.as_view(), name='profile-activity'),
     path('api/profile-info/<username>/',
          views.ProfileInfoView.as_view(), name='profile-info'),
     path('api/profile-intro/<username>/',
          views.ProfileMainView.as_view(), name='profile-main'),
     path('api/profile-image/<username>/',
          views.ProfileImageView.as_view(), name='profile-image'),
     path('api/profile-default-image/<username>/',
          views.ProfileImageDefaultView.as_view(), name='profile-default-image'),
     path('api/dashboard/<username>/',
          views.UserDashboardView.as_view(), name="UserDashboard"),
     path('api/dashboard/<username>/dev-tendency/',
          views.UserDevTendencyView.as_view(), name="UserDevTendency"),
     path('api/dashboard/<username>/dev-type/',
          views.UserDevTypeView.as_view(), name="UserDevType"),
     path('api/dashboard/<username>/dev-type/save/',
          views.DevTypeTestSaveView.as_view(), name='DevTypeTestSave'),
     path('api/dashboard/<username>/contr/',
          views.TotalContrView.as_view(), name='TotalContr'),
     path('api/dashboard/dev-type/statistics/', views.DevTypeStatisticsView.as_view(), name='DevTypeStatistics'),
     path('api/account-privacy/<username>/',
          views.AccountPrivacyView.as_view(), name='account-privacy'),
     path('api/qna/', views.QnAListView.as_view(), name='qna-list'),
     path('api/qna/create/', views.QnACreateView.as_view(), name='qna-create'),
     path('api/qna/<int:id>/', views.QnADetailView.as_view(), name='qna-detail'),
]