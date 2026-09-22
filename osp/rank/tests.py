from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from .views import get_user_star_counts, rank_user_scores


class UserRankingTieBreakTests(SimpleTestCase):
    def test_equal_scores_are_ordered_by_scored_stars_without_changing_tied_rank(self):
        rows = [
            {'id': 1, 'year': 2026, 'github_id': 'first', 'score': 5.0},
            {'id': 2, 'year': 2026, 'github_id': 'second', 'score': 7.0},
            {'id': 3, 'year': 2026, 'github_id': 'Third', 'score': 5.0},
            {'id': 4, 'year': 2026, 'github_id': 'fourth', 'score': 5.0},
            {'id': 5, 'year': 2025, 'github_id': 'Third', 'score': 1.0},
        ]
        stars = {
            ('first', 2026): 3,
            ('third', 2026): 10,
            ('fourth', 2026): 10,
            ('third', 2025): 99,
        }

        ranked = rank_user_scores(rows, stars)

        self.assertEqual([row['id'] for row in ranked], [2, 3, 4, 1, 5])
        self.assertEqual([row['rank'] for row in ranked], [1, 2, 2, 2, 3])
        self.assertEqual(ranked[-1]['star_count'], 99)

    def test_star_counts_match_spring_score_eligibility_and_year(self):
        cursor = MagicMock()
        cursor.fetchall.return_value = [('owner', 2026, 9)]
        context_manager = MagicMock()
        context_manager.__enter__.return_value = cursor
        fake_connection = MagicMock()
        fake_connection.cursor.return_value = context_manager
        fake_connection.introspection.get_table_description.return_value = [
            SimpleNamespace(name='availability_status')
        ]

        with patch('rank.views.connection', fake_connection):
            counts = get_user_star_counts('2026')

        self.assertEqual(counts, {('owner', 2026): 9})
        query, params = cursor.execute.call_args.args
        self.assertIn('FROM github_contribution_stats AS stats', query)
        self.assertIn('JOIN github_repository AS repo', query)
        self.assertIn('repo.is_private = 0', query)
        self.assertIn('repo.availability_status', query)
        self.assertIn('BINARY repo.owner_name = BINARY account.github_login_username', query)
        self.assertIn('COALESCE(stats.commit_count, 0)', query)
        self.assertIn('COALESCE(stats.pr_count, 0)', query)
        self.assertIn('COALESCE(stats.issue_count, 0)', query)
        self.assertIn('stats.year = %s', query)
        self.assertEqual(params, ['PUBLICLY_UNAVAILABLE', '2026'])

    def test_star_counts_support_schema_before_availability_migration(self):
        cursor = MagicMock()
        cursor.fetchall.return_value = []
        context_manager = MagicMock()
        context_manager.__enter__.return_value = cursor
        fake_connection = MagicMock()
        fake_connection.cursor.return_value = context_manager
        fake_connection.introspection.get_table_description.return_value = []

        with patch('rank.views.connection', fake_connection):
            get_user_star_counts()

        query, params = cursor.execute.call_args.args
        self.assertNotIn('repo.availability_status', query)
        self.assertEqual(params, [])
