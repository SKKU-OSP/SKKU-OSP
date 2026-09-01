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
from .ai_proxy_views import AiEvaluationProxyView
from .pr_evaluation_views import (
    PrCountsView,
    PrEvaluationProgressView,
    PrEvaluationView,
    PrListView,
)
from .issue_evaluation_views import IssueListView, IssueEvaluationView, IssueCountsView
from .commit_evaluation_views import (
    CommitCountsView,
    CommitEvaluationView,
    CommitFileSummariesView,
    CommitListView,
)
from .ai_evaluation_usage_views import AiEvaluationQuotaView, AiEvaluationUsageView

urlpatterns = [
    path('', lambda req: redirect('/admin/')),
    path('admin/', admin.site.urls),
    path('v2/ai-evaluation/readme', AiEvaluationProxyView.as_view(), name='ai-evaluation-readme'),
    path('v2/ai-evaluation/pr-list', PrListView.as_view(), name='ai-evaluation-pr-list'),
    path('v2/ai-evaluation/pr-counts', PrCountsView.as_view(), name='ai-evaluation-pr-counts'),
    path('v2/ai-evaluation/pr', PrEvaluationView.as_view(), name='ai-evaluation-pr'),
    path(
        'v2/ai-evaluation/pr-progress',
        PrEvaluationProgressView.as_view(),
        name='ai-evaluation-pr-progress',
    ),
    path('v2/ai-evaluation/issue-list', IssueListView.as_view(), name='ai-evaluation-issue-list'),
    path('v2/ai-evaluation/issue-counts', IssueCountsView.as_view(), name='ai-evaluation-issue-counts'),
    path('v2/ai-evaluation/issue', IssueEvaluationView.as_view(), name='ai-evaluation-issue'),
    path('v2/ai-evaluation/commit-list', CommitListView.as_view(), name='ai-evaluation-commit-list'),
    path('v2/ai-evaluation/commit-counts', CommitCountsView.as_view(), name='ai-evaluation-commit-counts'),
    path('v2/ai-evaluation/commit', CommitEvaluationView.as_view(), name='ai-evaluation-commit'),
    path(
        'v2/ai-evaluation/commit-file-summaries',
        CommitFileSummariesView.as_view(),
        name='ai-evaluation-commit-file-summaries',
    ),
    path(
        'v2/ai-evaluation/usage',
        AiEvaluationUsageView.as_view(),
        name='ai-evaluation-usage',
    ),
    path(
        'v2/ai-evaluation/usage/me',
        AiEvaluationQuotaView.as_view(),
        name='ai-evaluation-usage-me',
    ),

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
