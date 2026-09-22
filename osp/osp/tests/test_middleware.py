from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase

from osp.middleware import SimpleMiddleware


class SimpleMiddlewareLoggingTest(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = SimpleMiddleware(lambda request: None)

    @patch('osp.middleware.logger.info')
    def test_progress_polling_skips_verbose_request_log(self, log_info):
        request = self.factory.get(
            '/v2/ai-evaluation/pr-progress?progressId=test1234',
            HTTP_AUTHORIZATION='Bearer secret-token',
        )

        self.middleware.process_request(request)

        log_info.assert_not_called()

    @patch('osp.middleware.logger.info')
    def test_sensitive_headers_are_redacted(self, log_info):
        request = self.factory.get(
            '/v2/ai-evaluation/pr',
            HTTP_AUTHORIZATION='Bearer secret-token',
            HTTP_COOKIE='access=secret-cookie',
        )

        self.middleware.process_request(request)

        logged_message = log_info.call_args.args[0]
        self.assertNotIn('secret-token', logged_message)
        self.assertNotIn('secret-cookie', logged_message)
        self.assertIn('[REDACTED]', logged_message)
