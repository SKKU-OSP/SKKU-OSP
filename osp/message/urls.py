from django.urls import path, include

from message import views

app_name = 'message'
urlpatterns = [
    path('api/list/<int:target_user_id>',
         views.MessageListView.as_view(), name='MessageList'),
    path('api/chat/<int:target_user_id>',
         views.MessageChatView.as_view(), name='MessageChat'),
    path('api/split/',
         views.MessageSplitView.as_view(), name='MessageSplit'),
    path('list/<int:selected_oppo>', views.message_list_view, name='message-list'),
    path('chat/<int:opponent>', views.message_chat_view, name='message-chat'),
    path('noti-read/', views.read_notification_all, name='notification-read-all'),
    path('noti-read/<int:noti_id>',
         views.read_notification, name='notification-read'),
    path('app-read/', views.read_app, name='read-app'),
]
