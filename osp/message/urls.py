from django.urls import path

from message import views

app_name = 'message'
urlpatterns = [
    # React
    path('api/room/list/<int:target_user_id>/',
         views.MessageRoomListView.as_view(), name='MessageRoomList'),
    path('api/chat/new/', views.MessageCheckNewView.as_view(),
         name='MessageCheck'),
    path('api/chat/<int:target_user_id>/',
         views.MessageChatView.as_view(), name='MessageChat'),
    path('api/noti-read/', views.NotificationReadAllView.as_view(),
         name='NotificationReadAll'),
    path('api/noti-read/<int:noti_id>/',
         views.NotificationReadView.as_view(), name='NotificationRead'),
    path('api/app-read/', views.ApplicationReadView.as_view(),
         name='ApplicationRead'),
    path('api/noti/list/', views.NotificationListView.as_view(),
         name='NotificationList'),
    path('api/split/',
         views.MessageSplitView.as_view(), name='MessageSplit'),

    # Django
    path('list/<int:selected_oppo>', views.message_list_view, name='message-list'),
    path('chat/<int:opponent>', views.message_chat_view, name='message-chat'),
    path('noti-read/', views.read_notification_all, name='notification-read-all'),
    path('noti-read/<int:noti_id>',
         views.read_notification, name='notification-read'),
    path('app-read/', views.read_app, name='read-app'),
]
