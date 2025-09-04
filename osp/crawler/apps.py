import os

from django.apps import AppConfig
from osp import settings


class CrawlerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'crawler'
    def ready(self) -> None:
        super().ready()
        if os.environ.get('RUN_MAIN', None) != 'true':
            if not settings.SCHEDULER_DEFAULT:
                from . import operator
                operator.start()
