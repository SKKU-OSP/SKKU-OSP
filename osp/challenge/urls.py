from django.urls import path

from challenge import views

app_name = 'challenge'

urlpatterns = [
    path('', views.challenge_list_view, name='Challenge'),

    path('api/list/', views.ChallengeListView.as_view(), name='ChallengeList'),
    path('api/list/<int:target_user_id>',
         views.ChallengeAchieveView.as_view(), name='ChallengeList'),




    path('check/', views.challenge_acheive_update, name='ChallengeCheck'),
    path('forbidden/', views.forbidden_page, name='forbbiden')
]
