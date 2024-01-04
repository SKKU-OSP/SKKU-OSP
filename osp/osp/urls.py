"""osp URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import debug_toolbar
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path, re_path

from .settings import DEBUG, MEDIA_ROOT, MEDIA_URL

urlpatterns = [
    path('', lambda req: redirect('/admin/')),
    path('admin/', admin.site.urls),

    path('home/', include('home.urls')),
    path('rank/', include('rank.urls')),
    path('accounts/', include('common.urls')),
    path('user/', include('user.urls')),
    path('tag/', include('tag.urls')),
    path('team/', include('team.urls')),
    path('community/', include('community.urls')),
    path('message/', include('message.urls')),
    path('challenge/', include('challenge.urls')),
    path('accounts/', include('django.contrib.auth.urls'))
]

if DEBUG:
    urlpatterns += [
        re_path(r'^__debug__/', include(debug_toolbar.urls)),
    ]

if DEBUG:
    urlpatterns += static(MEDIA_URL, document_root=MEDIA_ROOT)
