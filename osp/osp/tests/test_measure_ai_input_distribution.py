from django.test import SimpleTestCase

import measure_ai_input_distribution as measure


class MeasureAiInputDistributionTest(SimpleTestCase):
    def test_sample_rows_is_reproducible_and_target_specific(self):
        rows = [{'db_id': value} for value in range(100)]

        first = measure.sample_rows(rows, 'README', 10, 1234, False)
        second = measure.sample_rows(rows, 'README', 10, 1234, False)
        pr_sample = measure.sample_rows(rows, 'PR', 10, 1234, False)

        self.assertEqual(first, second)
        self.assertNotEqual(first, pr_sample)

    def test_nearest_rank_percentiles_include_long_tail(self):
        values = [1, 2, 3, 4, 100]

        stats = measure.describe(values)

        self.assertEqual(stats['N'], 5)
        self.assertEqual(stats['median'], 3)
        self.assertEqual(stats['p90'], 100)
        self.assertEqual(stats['p99'], 100)

    def test_source_patch_reuses_generated_and_unavailable_guards(self):
        patch, generated_count, patch_files, unavailable = measure.source_patch([
            {'filename': 'src/app.py', 'patch': '@@ -0,0 +1 @@\n+print(1)'},
            {'filename': 'package-lock.json', 'patch': '@@ -0,0 +1 @@\n+lock'},
            {'filename': 'assets/logo.png', 'patch': None},
        ])

        self.assertIn('print(1)', patch)
        self.assertNotIn('+lock', patch)
        self.assertEqual(generated_count, 1)
        self.assertEqual(patch_files, 1)
        self.assertEqual(unavailable, 1)

    def test_summary_uses_measured_patch_denominator_for_token_thresholds(self):
        rows = [
            {
                'target': 'COMMIT', 'status': 'measured',
                'patch_tokens': 60001, 'files_300_plus': False,
                'is_merge_commit': False,
            },
            {
                'target': 'COMMIT', 'status': 'merge_skipped',
                'files_300_plus': False, 'is_merge_commit': True,
            },
            {
                'target': 'COMMIT', 'status': 'file_limit_skipped',
                'files_300_plus': True, 'is_merge_commit': False,
            },
        ]

        summary = measure.build_summary(rows)

        self.assertEqual(summary['COMMIT']['threshold_denominator'], 1)
        self.assertEqual(
            summary['COMMIT']['ratios']['patch_over_60000'],
            {'count': 1, 'total': 1, 'percent': 100.0},
        )
        self.assertEqual(
            summary['COMMIT']['ratios']['merge_commit'],
            {'count': 1, 'total': 3, 'percent': 33.33},
        )
        self.assertEqual(
            summary['COMMIT']['ratios']['files_300_plus'],
            {'count': 1, 'total': 3, 'percent': 33.33},
        )
