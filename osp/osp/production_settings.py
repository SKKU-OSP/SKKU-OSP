# coding=utf-8
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': "github_crawl",
        'USER': "root",
        'PASSWORD': "1234",
        'HOST': "host.docker.internal",
        'PORT': 4410,
    }
}

DEBUG = False

ALLOWED_HOSTS = ['*']

DATA_DIR = f"/data"