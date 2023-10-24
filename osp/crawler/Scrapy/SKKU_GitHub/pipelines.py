# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
import sys
import re
import logging
import pymysql
from itemadapter import ItemAdapter
from scrapy import signals
from pydispatch import dispatcher
from .items import *
from .settings import *


class SkkuGithubPipeline:
    def deEmoji(self, data):
        for key in data:
            if type(data[key]) == str:
                data[key] = self.emoji_pattern.sub(r'', data[key])

    def __init__(self) -> None:

        self.crawlDB = None
        self.cursor = None
        try:
            dispatcher.connect(self.spider_opened, signals.spider_opened)
            dispatcher.connect(self.spider_closed, signals.spider_closed)
        except Exception as e:
            logging.exception(f'ERROR: dispatcher connection failed: {e}')
            sys.exit(1)

        self.wait = {}
        self.lost = {}
        self.emoji_pattern = re.compile(
            "["u"\U00010000-\U0010FFFF""]+", flags=re.UNICODE)

    def spider_opened(self, spider):

        logging.info("spider_opened")
        try:
            self.crawlDB = pymysql.connect(
                user=SQL_USER,
                passwd=SQL_PW,
                host=SQL_HOST,
                port=SQL_PORT,
                db=SQL_DB
            )
            self.cursor = self.crawlDB.cursor()
        except Exception as e:
            logging.exception(f'ERROR: DB connection failed: {e}')
            sys.exit(1)

    def spider_closed(self, spider):

        logging.info("spider_closed")
        try:
            self.cursor.close()
            self.crawlDB.close()
        except Exception as e:
            logging.exception(f'ERROR: DB close failed: {e}')
            sys.exit(1)

    def reconn(self):

        logging.info("DB reconnect")
        try:
            self.cursor.close()
            self.crawlDB.close()
        except Exception as e:
            logging.exception(f'ERROR: DB close failed {e}')
            sys.exit(1)
        try:
            self.crawlDB = pymysql.connect(
                user=SQL_USER,
                passwd=SQL_PW,
                host=SQL_HOST,
                port=SQL_PORT,
                db=SQL_DB
            )
            self.cursor = self.crawlDB.cursor()
        except:
            logging.exception(f'ERROR: DB reconnection failed: {e}')
            sys.exit(1)

    def process_item(self, item, spider):
        insert = False
        if type(item) == User:
            self.wait[item['github_id']] = item
            # github 최신 업데이트 날짜 반영
            update_sql = f'''UPDATE github_overview SET github_updated_date=DATE_FORMAT("{item['github_updated_date']}", "%Y-%m-%d"), updated_date=DATE_FORMAT("{item['updated_date']}", "%Y-%m-%d") WHERE github_id="{item['github_id']}"'''
            self.cursor.execute(update_sql)
            self.crawlDB.commit()

        elif type(item) == UserUpdate:
            prev = self.wait[item['github_id']]
            if item['target'] == 'badge':
                prev['achievements'] = item['achievements']
                prev['highlights'] = item['highlights']
            elif item['target'] == 'activity':
                prev['total_commits'] += item['total_commits']
                prev['total_PRs'] += item['total_PRs']
                prev['total_issues'] += item['total_issues']
            elif item['target'] == 'repo_star':
                prev['stars'] += item['stars']
            prev['request_cnt'] -= 1
            self.wait[item['github_id']] = prev
            if prev['request_cnt'] == 0:
                self.wait.pop(item['github_id'])
                insert = True
                data = prev
                del data['request_cnt']
        else:
            insert = True
            data = item

        if insert:
            self.deEmoji(data)
            if type(data) == User:
                table_name = 'github_overview'
                key_col = ['github_id']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == UserFollowing:
                table_name = 'github_user_following'
                key_col = ['github_id', 'following_id']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == UserStarred:
                table_name = 'github_user_starred'
                key_col = ['github_id', 'starred_repo_owner',
                           'starred_repo_name']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == UserPeriod:
                table_name = 'github_stats_yymm'
                key_col = ['github_id', 'start_yymm', 'end_yymm']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == Repo:
                table_name = 'github_repo_stats'
                del (data['path'])
                key_col = ['github_id', 'repo_name']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == RepoUpdate:
                table_name = 'github_repo_stats'
                data['github_id'] = data['path'].split('/')[0]
                data['repo_name'] = data['path'].split('/')[1]
                del (data['path'])
                key_col = ['github_id', 'repo_name']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == RepoContribute:
                table_name = 'github_repo_contributor'
                key_col = ['github_id', 'owner_id', 'repo_name']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == RepoCommit:
                table_name = 'github_repo_commits'
                key_col = ['github_id', 'repo_name', 'sha']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == RepoCommitFile:
                table_name = 'github_repo_commit_files'
                key_col = ['github_id', 'repo_name', 'sha', 'filename']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == Issue:
                table_name = 'github_issues'
                key_col = ['github_id', 'repo_name', 'number']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == PullRequest:
                table_name = 'github_pulls'
                key_col = ['github_id', 'repo_name', 'number']
                data_col = list(set(data.keys()) - set(key_col))
            if type(data) == Star:
                table_name = 'github_stars'
                key_col = ['github_id', 'repo_name', 'stargazer']
                data_col = list(set(data.keys()) - set(key_col))

            select_sql = f'SELECT * FROM {table_name} WHERE {" AND ".join([f"{x} = %s" for x in key_col])}'
            select_data = [data[x] for x in key_col]
            update_sql = f'UPDATE {table_name} SET {", ".join([f"{x} = %s" for x in data_col])} WHERE {" AND ".join([f"{x} = %s" for x in key_col])}'
            update_data = [data[x] for x in data_col + key_col]
            insert_sql = f'INSERT INTO {table_name}({", ".join(key_col + data_col)}) '
            insert_sql += f'VALUES({", ".join(["%s"]*len(data))})'
            insert_data = [data[x] for x in key_col + data_col]
            try:
                self.crawlDB.ping(reconnect=True)
                if self.cursor.execute(select_sql, select_data) == 0:
                    self.cursor.execute(insert_sql, insert_data)
                elif len(update_data) != len(key_col):
                    self.cursor.execute(update_sql, update_data)
                self.crawlDB.commit()
            except Exception as e:
                logging.exception(f"sql execute exception {e}")
                logging.info(self.cursor.mogrify(select_sql, select_data))
                logging.info(self.cursor.mogrify(insert_sql, insert_data))
                if len(update_data) != 0:
                    logging.info(self.cursor.mogrify(update_sql, update_data))
                logging.info('\n')
                self.reconn()
        return item
