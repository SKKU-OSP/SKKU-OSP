"""
Django settings for osp project.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""
import mimetypes
from django.core.exceptions import ImproperlyConfigured
import json
import os
from pathlib import Path
import pymysql
from datetime import timedelta

pymysql.install_as_MySQLdb()


# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = f"{BASE_DIR}/data"


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

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
elif os.environ['ENV_MODE'] in ['PRODUCT', 'CRAWL']:
    SETTINGS = get_secret('PRODUCT')
    DEBUG = False
else:
    SETTINGS = get_secret('DEBUG')

# 발신할 이메일
EMAIL_HOST_USER = SETTINGS.get('EMAIL_HOST_USER', '')
# 발신할 메일의 비밀번호
EMAIL_HOST_PASSWORD = SETTINGS.get('EMAIL_HOST_PASSWORD', '')

EMAIL_HOST = SETTINGS.get('EMAIL_HOST', '')
EMAIL_PORT = SETTINGS.get('EMAIL_PORT', '')
EMAIL_HOST_SSL = True
EMAIL_USE_TLS = True


# 사이트와 관련한 자동응답을 받을 이메일 주소
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# GitHub OAuth
GITHUB_CLIENT_ID = SETTINGS.get('GITHUB_CLIENT_ID', None)
GITHUB_CLIENT_SECRET = SETTINGS.get('GITHUB_CLIENT_SECRET', None)

DATABASES = SETTINGS.get('DATABASES', None)

ALLOWED_HOSTS = SETTINGS.get('ALLOWED_HOSTS', [])
CSRF_TRUSTED_ORIGINS = SETTINGS.get('CSRF_TRUSTED_ORIGINS', [])


# Application definition
# debug_toolbar는 필요할 때 주석 해제하여 사용
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # 여러개 사이트 등록
    'django.contrib.sites',
    'django_apscheduler',
    # 'debug_toolbar',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'rest_framework.authtoken',
    'corsheaders',
    'fontawesomefree',
    # OUR APP
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
    'crawler',
]

SITE_ID = 1

REST_FRAMEWORK = {
    # 인증된 사용자만 API에 접근 가능하도록 권한 설정
    # 'DEFAULT_PERMISSION_CLASSES': (
    #     'rest_framework.permissions.IsAuthenticated',
    # ),
    # 세션 인증과 JWT 쿠키 인증을 사용하여 API에 접근 가능하도록 인증 설정
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
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

# JWT 인증 사용
REST_USE_JWT = True
SIMPLE_JWT = {
    # Access Token의 유효 시간을 4시간으로 설정
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=4),
    # Refresh Token의 유효 시간을 7일로 설정
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,  # Refresh Token 갱신 하지 않음
    'BLACKLIST_AFTER_ROTATION': True,  # Refresh Token 갱신 후 이전 토큰을 블랙리스트에 추가
}
CORS_ORIGIN_WHITELIST = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
CORS_ALLOW_CREDENTIALS = True

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
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

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
CSRF_FAILURE_VIEW = 'common.views_legacy.csrf_failure'

# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Seoul'  # 한국시간

USE_I18N = True

USE_L10N = True  # locale-dictated format 우선순위

USE_TZ = False


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

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
