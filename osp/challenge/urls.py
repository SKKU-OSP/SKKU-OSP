from django.urls import path

from challenge import views

app_name = 'challenge'

urlpatterns = [
    path('api/list/', views.ChallengeListView.as_view(), name='ChallengeList'),
    path('api/list/<int:target_user_id>/',
         views.ChallengeAchieveView.as_view(), name='ChallengeAchieve'),
    path('api/update/<int:target_user_id>/',
         views.AchievementUpdateView.as_view(), name='AchievementUpdate'),
]
