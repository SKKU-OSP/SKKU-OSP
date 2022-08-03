import os
import subprocess
from datetime import datetime

from osp.settings import CRAWLING_LOG_PATH, BASE_DIR
from user.models import Account

from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import register_events, DjangoJobStore

def start():
    scheduler=BackgroundScheduler(timezone='Asia/Seoul')
    scheduler.add_jobstore(DjangoJobStore(), 'djangojobstore')
    register_events(scheduler)
    @scheduler.scheduled_job('cron', hour=0, minute=0, id='crawling')
    def crawl_job():
        github_id_list = Account.objects.all().values_list('student_data__github_id', flat=True)
        github_id_list = '\n'.join(github_id_list)
        log_file = os.path.join(CRAWLING_LOG_PATH, f'{datetime.now().strftime("%y%m%d_crawl.log")}')
        print('Start!')
        subprocess.Popen(
            f'scrapy crawl github --loglevel=INFO --logfile={log_file}',
            shell=True,
            cwd=os.path.join(BASE_DIR, 'crawler/Scrapy/SKKU_GitHub'),
        )
        print('End!')
    scheduler.start()