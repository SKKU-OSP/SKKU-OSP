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

import time
import json
import os
import datetime


from collections import defaultdict

class _PercentileBins:
    """고정 버킷 히스토그램으로 p50/p90/p99 계산 (단위: 초)"""
    def __init__(self, edges=(0.001,0.002,0.005,0.01,0.02,0.05,0.1,0.2,0.5,1,2,5)):
        self.edges = list(edges)
        self.counts = [0]*(len(self.edges)+1)
        self.total = 0
        self.sum = 0.0
    def add(self, v):
        self.total += 1
        self.sum += v
        for i,e in enumerate(self.edges):
            if v <= e:
                self.counts[i]+=1; return
        self.counts[-1]+=1
    def _percentile(self, p):  # p=0.5,0.9,0.99
        need = max(1, int(self.total*p))
        acc = 0
        for i,c in enumerate(self.counts):
            acc += c
            if acc >= need:
                return (self.edges[i] if i < len(self.edges) else float('inf'))
        return float('inf')
    def summary(self):
        if self.total == 0:
            return {"count":0,"avg":None,"p50":None,"p90":None,"p99":None}
        return {"count": self.total, "avg": self.sum/self.total,
                "p50": self._percentile(0.5),
                "p90": self._percentile(0.9),
                "p99": self._percentile(0.99)}

class SkkuGithubPipeline:
    def deEmoji(self, data):
        for key in data:
            if type(data[key]) == str:
                data[key] = self.emoji_pattern.sub(r'', data[key])

    @classmethod
    def from_crawler(cls, crawler):
        inst = cls()
        inst.stats = crawler.stats
        inst.settings = crawler.settings  # ← 추가
        # 구간별 타이머 준비
        inst.timers = defaultdict(_PercentileBins)
        return inst
    
    def _timeit(self, name):
        class _T:
            def __init__(self, outer, n):
                self.o, self.n, self.t0 = outer, n, None
            def __enter__(self):
                self.t0 = time.perf_counter()
            def __exit__(self, exc_type, exc, tb):
                dt = time.perf_counter() - self.t0
                self.o._tick(self.n, dt)
        return _T(self, name)
    
    def _tick(self, name, dur):
        self.timers[name].add(dur)
        if self.stats:
            self.stats.inc_value(f"time.{name}.sum", dur)
            self.stats.inc_value(f"time.{name}.cnt", 1)

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
        t0 = time.perf_counter()

        # 아이템 타입 카운트
        if self.stats:
            self.stats.inc_value(f"count.item_type.{type(item).__name__}", 1)

        insert = False
        # --- (기존 분기/머지 로직은 그대로) ---
        if type(item) == User:
            self.wait[item['github_id']] = item
            update_sql = f'''UPDATE github_overview SET github_updated_date=DATE_FORMAT("{item['github_updated_date']}", "%Y-%m-%d"), updated_date=DATE_FORMAT("{item['updated_date']}", "%Y-%m-%d") WHERE github_id="{item['github_id']}"'''
            with self._timeit("db.exec.update.github_overview"):
                self.cursor.execute(update_sql)
            with self._timeit("db.commit"):
                self.crawlDB.commit()

        elif type(item) == UserUpdate:
            # ... (기존 그대로) ...
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
           
            # 테이블 카운트(분포 비교용)
            if self.stats:
                self.stats.inc_value(f"count.table.{table_name}", 1)

            select_sql = f'SELECT * FROM {table_name} WHERE {" AND ".join([f"{x} = %s" for x in key_col])}'
            select_data = [data[x] for x in key_col]
            update_sql = f'UPDATE {table_name} SET {", ".join([f"{x} = %s" for x in data_col])} WHERE {" AND ".join([f"{x} = %s" for x in key_col])}'
            update_data = [data[x] for x in data_col + key_col]
            insert_sql = f'INSERT INTO {table_name}({", ".join(key_col + data_col)}) '
            insert_sql += f'VALUES({", ".join(["%s"]*len(data))})'
            insert_data = [data[x] for x in key_col + data_col]

            try:
                with self._timeit("db.ping"):
                    self.crawlDB.ping(reconnect=True)

                # SELECT (per-table, overall 둘 다 찍고 싶으면 이름 두 개로 감싸도 됨)
                with self._timeit(f"db.select.{table_name}"):
                    found = self.cursor.execute(select_sql, select_data)

                if found == 0:
                    with self._timeit(f"db.insert.{table_name}"):
                        self.cursor.execute(insert_sql, insert_data)
                else:
                    # 원래 코드의 조건을 유지 (다만, 실제 의도대로라면 data_col 존재 체크 권장)
                    if len(update_data) != len(key_col):
                        with self._timeit(f"db.update.{table_name}"):
                            self.cursor.execute(update_sql, update_data)

                with self._timeit("db.commit"):
                    self.crawlDB.commit()

            except Exception as e:
                logging.exception(f"sql execute exception {e}")
                try:
                    logging.info(self.cursor.mogrify(select_sql, select_data))
                    logging.info(self.cursor.mogrify(insert_sql, insert_data))
                    if len(update_data) != 0:
                        logging.info(self.cursor.mogrify(update_sql, update_data))
                except Exception:
                    pass
                logging.info('\n')
                self.reconn()

        # 파이프라인 총 처리 시간
        self._tick("pipeline.total", time.perf_counter() - t0)
        return item
    
    def spider_closed(self, spider):
        logging.info("spider_closed")
        try:
            self.cursor.close()
            self.crawlDB.close()
        except Exception as e:
            logging.exception(f'ERROR: DB close failed: {e}')
            sys.exit(1)

        # ===== 계측 요약 파일로 저장 =====
        out = {}
        for name, bins in self.timers.items():
            out[name] = bins.summary()

        # stats에 누적된 카운트도 일부 함께 담기(선택)
        counts = {}
        if self.stats:
            for k, v in self.stats.get_stats().items():
                if isinstance(k, str) and (k.startswith("count.item_type.") or k.startswith("count.table.")):
                    counts[k] = v
        out["_counts"] = counts

        tag = self.settings.get('METRIC_TAG', 'NA')
        out_dir = self.settings.get('METRIC_OUT_DIR', 'metric_out')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f"metrics-{tag}.json")

        out["_meta"] = {
            "tag": tag,
            "ended_at_utc": datetime.datetime.utcnow().isoformat()
        }

        try:
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(out, f, indent=2, ensure_ascii=False)
            logging.info(f"[METRIC] wrote {out_path}")
        except Exception as e:
            logging.exception(f"[METRIC] failed to write {out_path}: {e}")
