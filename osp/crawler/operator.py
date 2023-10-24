import os
import subprocess
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
import django.db
from django.db.models import F

from osp.settings import CRAWLING_LOG_PATH, BASE_DIR
from user.models import Account, GithubOverview
from home.updateScore import user_score_update
from home.updateChart import update_chart
from challenge.models import Challenge
from challenge.views import achievement_check
from user.update_act import update_commmit_time, update_individual, update_frequency
from django.contrib.auth.models import User


def start():
    envmode = os.getenv('ENV_MODE')
    if (envmode == "PRODUCT"):
        crawl_time = ''
    elif (envmode == "CRAWL"):
        crawl_time = '10, 22'
    elif (envmode == "DEV"):
        crawl_time = ''
    else:
        crawl_time = '4, 16'

    scheduler = BackgroundScheduler(timezone='Asia/Seoul')

    @scheduler.scheduled_job('cron', hour=crawl_time, misfire_grace_time=60, id='crawling_overview')
    def crawl_overview_job():
        print('crawl_overview_job Start!', datetime.now())
        try:
            auth_user_ids = User.objects.filter(
                is_superuser=False).values_list("id", flat=True)
            print("auth_user_ids", auth_user_ids)
            github_id_list = Account.objects.filter(user_id__in=auth_user_ids).values_list(
                'student_data__github_id', flat=True)
        except:
            print("try close_old_connections")
            django.db.close_old_connections()
            auth_user_ids = User.objects.filter(
                is_superuser=False).values_list("id", flat=True)
            github_id_list = Account.objects.filter(user_id__in=auth_user_ids).values_list(
                'student_data__github_id', flat=True)
        print(f"crawl_job: Get Target Account {len(github_id_list)}")
        github_id_list = ','.join(github_id_list)
        log_file = datetime.now().strftime("%y%m%d_%H%M_crawl_overview.log")
        log_path = os.path.join(CRAWLING_LOG_PATH, f'{log_file}')
        print(
            f'scrapy crawl github_overview -a ids={github_id_list} --loglevel=INFO --logfile={log_path}')
        subprocess.Popen(
            f'scrapy crawl github_overview -a ids="{github_id_list}" --loglevel=INFO --logfile={log_path}',
            shell=True,
            cwd=os.path.join(BASE_DIR, 'crawler/Scrapy/SKKU_GitHub'),
        )
        print('crawl_job:django.db.close_old_connections()')
        django.db.close_old_connections()

    @scheduler.scheduled_job('cron', hour='0, 12', misfire_grace_time=60, id='crawling')
    def crawl_job():
        print('crawl_job Start!', datetime.now())
        try:
            # 크롤링 날짜 이후에 Github 업데이트 내용이 있으면 크롤링 대상에 포함
            pre_crawled_list = GithubOverview.objects.filter(
                github_updated_date__lt=F("crawled_date")).values_list("github_id", flat=True)
            print("pre_crawled_list", len(pre_crawled_list))
            github_id_list = Account.objects.filter(user__is_superuser=False).exclude(
                student_data__github_id__in=pre_crawled_list).values_list('student_data__github_id', flat=True)
        except:
            print("try close_old_connections")
            django.db.close_old_connections()
            pre_crawled_list = GithubOverview.objects.filter(
                github_updated_date__lt=F("crawled_date")).values_list("github_id", flat=True)
            github_id_list = Account.objects.filter(user__is_superuser=False).exclude(
                student_data__github_id=pre_crawled_list).values_list('student_data__github_id', flat=True)
        print(f"crawl_job: Get Target Account {len(github_id_list)}")
        github_id_list = ','.join(github_id_list)
        log_file = datetime.now().strftime("%y%m%d_%H%M_crawl.log")
        log_path = os.path.join(CRAWLING_LOG_PATH, f'{log_file}')
        print(
            f'scrapy crawl github -a ids={github_id_list} --loglevel=INFO --logfile={log_path}')
        subprocess.Popen(
            f'scrapy crawl github -a ids="{github_id_list}" --loglevel=INFO --logfile={log_path}',
            shell=True,
            cwd=os.path.join(BASE_DIR, 'crawler/Scrapy/SKKU_GitHub'),
        )
        print('crawl_job:django.db.close_old_connections()')
        django.db.close_old_connections()

    @scheduler.scheduled_job('cron', hour='6,18', misfire_grace_time=60, id='update_score')
    def update_score():
        print('Update Start!')
        challenge_list = Challenge.objects.all()
        end_year = datetime.now().year
        start_year = 2019
        for user in Account.objects.filter(user__is_superuser=False):
            for chal in challenge_list:
                achievement_check(user, chal)
            for year in range(end_year, start_year-1, -1):
                user_score_update(user, year)
        update_commmit_time()
        update_individual()
        update_frequency()
        update_chart(63)
        print('update_score:django.db.close_old_connections()')
        django.db.close_old_connections()
        print('Done!')

    scheduler.start()
