from django.urls import path
from tag import views

app_name = 'tag'

urlpatterns = [
    path('api/', views.TagAPIView.as_view(), name='tag-api'),
    path('api/list/', views.TagListView.as_view(), name='TagList'),
    path('api/create/', views.TagCreateView.as_view(), name='TagCreate')
]
