# Define here the models for your spider middleware
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/spider-middleware.html

from time import sleep

from scrapy import signals

# useful for handling different item types with a single interface
from itemadapter import is_item, ItemAdapter
from scrapy.downloadermiddlewares.defaultheaders import DefaultHeadersMiddleware
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.utils.response import response_status_message
from datetime import datetime, timedelta
from .configure import OAUTH_TOKEN
from queue import PriorityQueue
import logging

class TokenRetryMiddleware(RetryMiddleware):

    def __init__(self, crawler):
        super(TokenRetryMiddleware, self).__init__(crawler.settings)
        self.crawler = crawler
        self.remain_token = OAUTH_TOKEN
        self.exhausted_token = PriorityQueue()

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)
        
    def process_request(self, request, spider):
        # Called for each request that goes through the downloader
        # middleware.
        raw_url = request.url
        raw_url = raw_url[raw_url.find('://') + 3:]
        raw_url = raw_url[:raw_url.find('/')]
        if raw_url == 'api.github.com':
            request.headers['Authorization'] = f'token {self.remain_token[0]}'
        return None

    def process_response(self, request, response, spider):
        if request.meta.get('dont_retry', False):
            return response
        elif response.status == 429:
            spider.logger.log(logging.DEBUG, f'HTML Request Pause {request.url}')
            self.crawler.engine.pause()
            sleep(5)
            self.crawler.engine.unpause()
            reason = response_status_message(response.status)
            return self._retry(request, reason, spider) or response
        elif response.status == 403:
            req_hds = {}
            res_hds = {}
            for key in response.headers:
                res_hds[key.decode()] = response.headers[key].decode()
            for key in request.headers:
                req_hds[key.decode()] = request.headers[key].decode()

            now_token = req_hds["Authorization"].split()[1]
            reset_time = int(res_hds['X-Ratelimit-Reset'])
            self.exhausted_token.put((reset_time, now_token))
            if now_token in self.remain_token:
                self.remain_token.remove(now_token)
            
            if len(self.remain_token) == 0:
                reset_time, next_token = self.exhausted_token.get()
                reset_time = datetime.fromtimestamp(reset_time)
                wait_time = reset_time - datetime.now()
                if wait_time > timedelta(seconds=1):
                    spider.logger.log(logging.INFO, f'API Quota Exhausted, Enter Sleep mode(Reset Time: {reset_time} / Wait Time: {wait_time.seconds})')
                    self.crawler.engine.pause()
                    sleep(wait_time.seconds)
                    self.crawler.engine.unpause()
                    spider.logger.log(logging.INFO, f'Wake up from Sleep mode')
                self.remain_token.append(next_token)
            spider.logger.log(logging.INFO, f'Change token to {self.remain_token[0]} from {now_token}')
            request.headers['Authorization'] = f'token {self.remain_token[0]}'
            
            reason = response_status_message(response.status)
            return self._retry(request, reason, spider) or response
        elif response.status in self.retry_http_codes:
            reason = response_status_message(response.status)
            return self._retry(request, reason, spider) or response
        return response 