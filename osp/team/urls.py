from django.urls import path, include
from team import views

app_name = 'team'

urlpatterns = [
    path('api/team-create', views.TeamCreate, name='team-create'),
    path('api/team-update', views.TeamUpdate, name='team-update'),
    # path('api/member', views.TeamMemberAPI.asView(), name='TeamMember API'),
]