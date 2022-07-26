from django.urls import path, include
from team import views

app_name = 'team'

urlpatterns = [
    path('api/team-create', views.TeamCreate, name='team-create'),
    path('api/team-update', views.TeamUpdate, name='team-update'),
    path('api/team-apply-list', views.TeamApplyList, name='team-apply-list'),

    path('api/team-apply/<int:team_id>', views.TeamApply, name='team-apply'),

    path('api/team-invite-update/', views.TeamInviteUpdate, name='invite-update'),
    path('api/team-out/', views.TeamOut, name='team-out'),
    # path('api/member', views.TeamMemberAPI.asView(), name='TeamMember API'),
]