from django.urls import path, include

from message import views

app_name = 'message'
urlpatterns = [
    path('list/', views.message_list_view, name='message-list'),
    path('chat/<int:opponent>', views.message_chat_view, name='message-chat'),
]