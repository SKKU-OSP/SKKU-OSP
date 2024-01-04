# Scrapy settings for SKKU_GitHub project
#
# For simplicity, this file contains only settings considered important or
# commonly used. You can find more settings consulting the documentation:
#
#     https://docs.scrapy.org/en/latest/topics/settings.html
#     https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
#     https://docs.scrapy.org/en/latest/topics/spider-middleware.html

from django.core.exceptions import ImproperlyConfigured
import json
import os
from pathlib import Path
BOT_NAME = 'SKKU_GitHub'

SPIDER_MODULES = ['SKKU_GitHub.spiders']
NEWSPIDER_MODULE = 'SKKU_GitHub.spiders'


# Crawl responsibly by identifying yourself (and your website) on the user-agent
# USER_AGENT = 'SKKU_GitHub (+http://www.yourdomain.com)'

# Obey robots.txt rules
ROBOTSTXT_OBEY = False

# Configure maximum concurrent requests performed by Scrapy (default: 16)
CONCURRENT_REQUESTS = 8

# Configure a delay for requests for the same website (default: 0)
# See https://docs.scrapy.org/en/latest/topics/settings.html#download-delay
# See also autothrottle settings and docs
# DOWNLOAD_DELAY = 3
# The download delay setting will honor only one of:
# CONCURRENT_REQUESTS_PER_DOMAIN = 16
# CONCURRENT_REQUESTS_PER_IP = 16

# Disable cookies (enabled by default)
# COOKIES_ENABLED = False

# Disable Telnet Console (enabled by default)
# TELNETCONSOLE_ENABLED = False

# Override the default request headers:
# DEFAULT_REQUEST_HEADERS = {
#   'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
#   'Accept-Language': 'en',
# }

# Enable or disable spider middlewares
# See https://docs.scrapy.org/en/latest/topics/spider-middleware.html
# SPIDER_MIDDLEWARES = {
#    'SKKU_GitHub.middlewares.SkkuGithubSpiderMiddleware': 543,
# }

# Enable or disable downloader middlewares
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
DOWNLOADER_MIDDLEWARES = {
    'scrapy.downloadermiddlewares.retry.RetryMiddleware': None,
    'SKKU_GitHub.middlewares.TokenRetryMiddleware': 543
}

# Enable or disable extensions
# See https://docs.scrapy.org/en/latest/topics/extensions.html
# EXTENSIONS = {
#    'scrapy.extensions.telnet.TelnetConsole': None,
# }

# Configure item pipelines
# See https://docs.scrapy.org/en/latest/topics/item-pipeline.html
ITEM_PIPELINES = {
    'SKKU_GitHub.pipelines.SkkuGithubPipeline': 300,
}

# Enable and configure the AutoThrottle extension (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/autothrottle.html
# AUTOTHROTTLE_ENABLED = True
# The initial download delay
# AUTOTHROTTLE_START_DELAY = 5
# The maximum download delay to be set in case of high latencies
# AUTOTHROTTLE_MAX_DELAY = 60
# The average number of requests Scrapy should be sending in parallel to
# each remote server
# AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
# Enable showing throttling stats for every response received:
# AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html#httpcache-middleware-settings
# HTTPCACHE_ENABLED = True
# HTTPCACHE_EXPIRATION_SECS = 0
# HTTPCACHE_DIR = 'httpcache'
# HTTPCACHE_IGNORE_HTTP_CODES = []
# HTTPCACHE_STORAGE = 'scrapy.extensions.httpcache.FilesystemCacheStorage'

RETRY_HTTP_CODE = [429]
REQUEST_FINGERPRINTER_IMPLEMENTATION = '2.7'

# Load Secret.key

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = f"{BASE_DIR}/data"

with open(os.path.join(DATA_DIR, "config", "secret.key"), "r") as f:
    secret = json.loads(f.read())


def get_secret(key, secret=secret):
    try:
        return secret[key]
    except Exception as e:
        msg = f"Setting Error: Can't read {key}, {e}"
        raise ImproperlyConfigured(msg)


if 'ENV_MODE' not in os.environ:
    SETTINGS = get_secret('DEBUG')
elif os.environ['ENV_MODE'] == 'DEV':
    SETTINGS = get_secret('DEV')
elif os.environ['ENV_MODE'] in ['PRODUCT', 'CRAWL']:
    SETTINGS = get_secret('PRODUCT')
else:
    SETTINGS = get_secret('DEBUG')


OAUTH_TOKEN = SETTINGS.get('OAUTH_TOKEN', [])
OAUTH_TOKEN_FOR_REG = SETTINGS.get('OAUTH_TOKEN_FOR_REG', [])
CRAWLER_DB = SETTINGS.get('CRAWLER_DB', None)

if CRAWLER_DB:
    SQL_USER = CRAWLER_DB['SQL_USER']
    SQL_PW = CRAWLER_DB['SQL_PW']
    SQL_HOST = CRAWLER_DB['SQL_HOST']
    SQL_PORT = CRAWLER_DB['SQL_PORT']
    SQL_DB = CRAWLER_DB['SQL_DB']
