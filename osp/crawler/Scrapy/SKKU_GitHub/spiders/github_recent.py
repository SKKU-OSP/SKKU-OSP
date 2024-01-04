import json
import logging
from datetime import datetime, timedelta
import scrapy

from ..items import *
from ..settings import *


API_URL = 'https://api.github.com'
HTML_URL = 'https://github.com'


class GithubOverviewSpider(scrapy.Spider):
    name = 'github_overview'

    def __init__(self, ids='', **kwargs):
        self.ids = []
        if ids != '':
            self.ids = ids.split(',')

    def start_requests(self):
        for id in self.ids:
            yield self.get_recent(f'users/{id}')

    def get_recent(self, endpoint):
        # 타겟 유저의 최신 push 기록을 확인한다.
        try:
            GITHUB_API_URL = f"{API_URL}/{endpoint}/repos?per_page=1&sort=pushed"
            return scrapy.Request(GITHUB_API_URL, callback=self.find_recent, meta={"endpoint": endpoint})
        except Exception as e:
            logging.warning("recent pushed")
            return self.api_get(endpoint, self.parse_user)

    def find_recent(self, res):
        # push 기록을 저장한 후 api_get을 호출해 크롤링을 진행한다.
        try:
            endpoint = res.meta["endpoint"]
            recent_json = json.loads(res.body)
            recent_at = recent_json[0]["pushed_at"]
            metadata = {"recent": recent_at[:10]}
        except Exception:
            logging.warning("parse err: recent pushed")
            metadata = {"recent": None}

        return self.api_get(endpoint, self.parse_user, metadata=metadata)

    def api_get(self, endpoint, callback, metadata={}, page=1, per_page=100):

        req = scrapy.Request(
            f'{API_URL}/{endpoint}?page={page}&per_page={per_page}',
            callback,
            meta=metadata,
            dont_filter=True
        )

        return req

    def parse_user(self, res):
        user_json = json.loads(res.body)
        github_id = user_json['login']
        user_item = User()
        user_item['github_id'] = github_id
        user_item['followers'] = user_json['followers']
        user_item['followings'] = user_json['following']
        user_item['total_repos'] = user_json['public_repos']
        created_date = user_json['created_at'][:10]
        updated_date = user_json['updated_at'][:10]

        updated_datetime = datetime.strptime(updated_date, '%Y-%m-%d')

        recent_date = res.meta['recent']
        logging.info(
            f"parse_user: created_date {created_date}, end_date {updated_date},  recent_date {recent_date}")
        user_item["github_updated_date"] = updated_date
        if recent_date != None:
            recent_datetime = datetime.strptime(recent_date[:10], '%Y-%m-%d')
            if updated_datetime < recent_datetime:
                updated_datetime = recent_datetime
                user_item["github_updated_date"] = recent_date

        user_item["updated_date"] = datetime.now().strftime("%Y-%m-%d")
        logging.info(
            f"parse_user: {github_id} updated_datetime {updated_datetime}")

        yield user_item
