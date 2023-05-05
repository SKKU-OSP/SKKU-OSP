"""
Django settings for osp project.

Generated by 'django-admin startproject' using Django 2.2.12.

For more information on this file, see
https://docs.djangoproject.com/en/2.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.2/ref/settings/
"""
import pymysql  
pymysql.install_as_MySQLdb()
import os
import json

from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BASE_DIR)
DATA_DIR = f"{BASE_DIR}/data"

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
with open(os.path.join(DATA_DIR, "config", "secret.key"), "r") as f:
    secret = json.loads(f.read())

def get_secret(key, secret=secret):
    try:
        return secret[key]
    except Exception as e:
        msg = f"Setting Error: Can't read {key}, {e}"
        raise ImproperlyConfigured(msg)

# Django secret key
SECRET_KEY = get_secret('SECRET_KEY') 
DEBUG = True
if 'ENV_MODE' not in os.environ:
    SETTINGS = get_secret('DEBUG')
elif os.environ['ENV_MODE'] == 'DEV':
    SETTINGS = get_secret('DEV')
elif os.environ['ENV_MODE'] == 'PRODUCT':
    SETTINGS = get_secret('PRODUCT')
    DEBUG = False
else:
    SETTINGS = get_secret('DEBUG')

# 발신할 이메일
EMAIL_HOST_USER = SETTINGS['EMAIL_HOST_USER'] if 'EMAIL_HOST_USER' in SETTINGS else ''
# 발신할 메일의 비밀번호
EMAIL_HOST_PASSWORD = SETTINGS['EMAIL_HOST_PASSWORD'] if 'EMAIL_HOST_PASSWORD' in SETTINGS else ''

EMAIL_HOST = SETTINGS['EMAIL_HOST'] if 'EMAIL_HOST' in SETTINGS else ''
EMAIL_PORT = SETTINGS['EMAIL_PORT'] if 'EMAIL_PORT' in SETTINGS else ''
EMAIL_HOST_SSL = True

# 사이트와 관련한 자동응답을 받을 이메일 주소
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# GitHub OAuth
GITHUB_CLIENT_ID = SETTINGS['GITHUB_CLIENT_ID'] if 'GITHUB_CLIENT_ID' in SETTINGS else None
GITHUB_CLIENT_SECRET = SETTINGS['GITHUB_CLIENT_SECRET'] if 'GITHUB_CLIENT_SECRET' in SETTINGS else None

DATABASES = SETTINGS['DATABASES'] if 'DATABASES' in SETTINGS else None

ALLOWED_HOSTS = SETTINGS['ALLOWED_HOSTS'] if 'ALLOWED_HOSTS' in SETTINGS else []
CSRF_TRUSTED_ORIGINS = SETTINGS['CSRF_TRUSTED_ORIGINS'] if 'CSRF_TRUSTED_ORIGINS' in SETTINGS else []


# Application definition
# debug_toolbar는 필요할 때 주석 해제하여 사용
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'home',
    'repository',
    'user',
    'rank',
    'common',
    'tag',
    'community',
    'team',
    'message',
    'challenge',
    'django_apscheduler',
    'crawler',
    # 'debug_toolbar',
    'fontawesomefree'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'debug_toolbar.middleware.DebugToolbarMiddleware'
]

DEBUG_TOOLBAR_PANELS = [
    'debug_toolbar.panels.history.HistoryPanel',
    'debug_toolbar.panels.versions.VersionsPanel',
    'debug_toolbar.panels.timer.TimerPanel',
    'debug_toolbar.panels.settings.SettingsPanel',
    'debug_toolbar.panels.headers.HeadersPanel',
    'debug_toolbar.panels.request.RequestPanel',
    'debug_toolbar.panels.sql.SQLPanel',
    # 'debug_toolbar.panels.staticfiles.StaticFilesPanel',
    'debug_toolbar.panels.templates.TemplatesPanel',
    'debug_toolbar.panels.cache.CachePanel',
    'debug_toolbar.panels.signals.SignalsPanel',
    'debug_toolbar.panels.redirects.RedirectsPanel',
    'debug_toolbar.panels.profiling.ProfilingPanel',
]

SECURE_CROSS_ORIGIN_OPENER_POLICY = None

import mimetypes
mimetypes.add_type("text/css", ".css", True)
mimetypes.add_type("application/javascript", ".js", True)

if DEBUG:

    DEBUG_TOOLBAR_PATCH_SETTINGS = False
    INTERNAL_IPS = ('127.0.0.1')
    def show_toolbar(request):
        return True
    DEBUG_TOOLBAR_CONFIG = {
    'INTERCEPT_REDIRECTS': False,
    "SHOW_TOOLBAR_CALLBACK": show_toolbar,
    'INSERT_BEFORE': '</head>',
    'INTERCEPT_REDIRECTS': False,
    'RENDER_PANELS': True,
    }

ROOT_URLCONF = 'osp.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],

        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'osp.wsgi.application'

# Password validation
# https://docs.djangoproject.com/en/2.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LOGIN_REDIRECT_URL = '/home/statistic/'
LOGOUT_REDIRECT_URL = '/accounts/login/'
CSRF_FAILURE_VIEW = 'common.views.csrf_failure'
# Internationalization
# https://docs.djangoproject.com/en/2.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Seoul'

USE_I18N = True

USE_L10N = True

USE_TZ = False


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.2/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static')
]

MEDIA_URL = '/data/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'data/media')

APSCHEDULER_DATETIME_FORMAT = "N j, Y, f:s a"  # Default

SCHEDULER_DEFAULT = True

CRAWLING_LOG_PATH = os.path.join(BASE_DIR, 'crawler/log')
