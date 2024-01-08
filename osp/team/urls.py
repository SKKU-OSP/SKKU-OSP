from django.urls import path

from team import views

app_name = 'team'

urlpatterns = [
    path('api/team-invite-on-teamboard/', views.TeamInviteOnTeamboardView.as_view(),
         name='team-invite-on-teamboard'),
    path('api/team-invite-on-recommend/', views.TeamInviteOnRecommendView.as_view(),
         name='team-invite-on-recommend'),
    path('api/team-create/', views.TeamCreateView.as_view(), name='team-create'),
    path('api/team-update/', views.TeamUpdateView.as_view(), name='team-update'),

    path('api/team-apply/<int:article_id>/',
         views.TeamApplyView.as_view(), name='team-apply'),
    path('api/team-out/', views.TeamOutView.as_view(), name='team-out'),
    path('api/team-invite-update/',
         views.TeamInviteUpdateView.as_view(), name='invite-update'),
    path('api/team-invite-delete/',
         views.TeamInviteDeleteView.as_view(), name='invite-delete'),
    path('api/team-apply-update/',
         views.TeamApplyUpdateView.as_view(), name='apply-update'),
    path('api/team-apply-delete/',
         views.TeamApplyDeleteView.as_view(), name='apply-delete'),
    path('api/teams-list/',
         views.TeamsListView.as_view(), name='teams-list'),
    path('api/teams-of-user-list/',
         views.TeamsOfUserListView.as_view(), name='teams-of-user-list'),
    path('api/applications/', views.TeamApplicationListView.as_view(),
         name='TeamApplicationList'),
    path('api/recommender/users/', views.UserRecommenderView.as_view(),
         name='UserRecommender')
]
