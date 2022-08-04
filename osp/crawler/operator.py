import os
import subprocess
from datetime import datetime

from osp.settings import CRAWLING_LOG_PATH, BASE_DIR
from user.models import Account
from home.updateScore import user_score_update
from challenge.models import Challenge
from challenge.views import achievement_check

from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import register_events, DjangoJobStore

def start():
    scheduler=BackgroundScheduler(timezone='Asia/Seoul')
    scheduler.add_jobstore(DjangoJobStore(), 'djangojobstore')
    register_events(scheduler)
    @scheduler.scheduled_job('cron', hour=0, minute=0, id='crawling')
    def crawl_job():
        github_id_list = Account.objects.all().values_list('student_data__github_id', flat=True)
        github_id_list = ','.join(github_id_list)
        log_file = os.path.join(CRAWLING_LOG_PATH, f'{datetime.now().strftime("%y%m%d_crawl.log")}')
        print('Start!')
        subprocess.Popen(
            f'scrapy crawl github -a ids={github_id_list} --loglevel=INFO --logfile={log_file}',
            shell=True,
            cwd=os.path.join(BASE_DIR, 'crawler/Scrapy/SKKU_GitHub'),
        )
        print('End!')
        challenge_list = Challenge.objects.all()
        year = datetime.now().year
        for user in Account.objects.all():
            for chal in challenge_list:
                achievement_check(user, chal)
            user_score_update(user, year)
    scheduler.start()