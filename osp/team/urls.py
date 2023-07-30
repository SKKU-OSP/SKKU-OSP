from django.urls import path, include
from team import views

app_name = 'team'

urlpatterns = [
    path('api/team-invite-on-teamboard', views.TeamInviteOnTeamboardView.as_view(),
         name='team-invite-on-teamboard'),
    path('api/team-invite-on-recommend', views.TeamInviteOnRecommendView.as_view(),
         name='team-invite-on-recommend'),
    path('api/team-create', views.TeamCreateView.as_view(), name='team-create'),
    path('api/team-update', views.TeamUpdateView.as_view(), name='team-update'),

    path('api/team-apply/',
         views.TeamApplyView.as_view(), name='team-apply'),
    path('api/team-out/', views.TeamOutView.as_view(), name='team-out'),
    path('api/team-invite-update/',
         views.TeamInviteUpdateView.as_view(), name='invite-update'),
    path('api/team-invite-delete/',
         views.TeamInviteDeleteView.as_view(), name='invite-delete'),

    # path('api/member', views.TeamMemberAPI.asView(), name='TeamMember API'),
]
