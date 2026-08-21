from datetime import datetime
from unittest import TestCase
from unittest.mock import MagicMock, patch

from osp import commit_evaluation_service as service
from osp import llm_client
from osp.commit_evaluation_views import _parse_repositories


class CommitEvaluationServiceTest(TestCase):
    def test_grade_uses_fixed_six_point_scale(self):
        self.assertEqual(service._to_grade(5), 'A+')
        self.assertEqual(service._to_grade(3.5), 'A')
        self.assertEqual(service._to_grade(2), 'B')
        self.assertEqual(service._to_grade(1), 'C')
        self.assertEqual(service._to_grade(0), 'D')

    def test_entity_response_keeps_six_point_max_when_axes_are_na(self):
        entity = MagicMock(
            sha='abc1234',
            model_name='claude-test',
            commit_score='A',
            commit_total_score=2,
            consistency_score=None,
            atomicity_score=None,
            commit_breakdown={
                'consistency_status': 'N/A',
                'atomicity_status': 'N/A',
            },
            commit_strengths=[],
            commit_improvements=[],
            commit_advice=[],
            updated_at=None,
        )

        result = service._entity_to_dict(entity)

        self.assertEqual(result['commit_max_score'], 6)
        self.assertEqual(result['commit_score'], 'B')

    @patch.object(service, 'connection')
    def test_commit_list_contains_actual_message_and_metadata(self, connection):
        cursor = MagicMock()
        cursor.fetchall.return_value = [
            (
                'abc123def456',
                'feat: 커밋 평가 추가',
                '평가 근거를 저장하기 위해 추가합니다.',
                'octocat',
                datetime(2026, 8, 12, 10, 0),
                datetime(2026, 8, 12, 10, 5),
                42,
                7,
            )
        ]
        connection.cursor.return_value.__enter__.return_value = cursor

        result = service.get_commit_list('octocat', 'hello-world')

        self.assertEqual(result[0]['message'], 'feat: 커밋 평가 추가')
        self.assertEqual(result[0]['message_body'], '평가 근거를 저장하기 위해 추가합니다.')
        self.assertEqual(result[0]['sha'], 'abc123def456')
        self.assertEqual(result[0]['author'], 'octocat')
        self.assertEqual(result[0]['additions'], 42)
        self.assertEqual(result[0]['deletions'], 7)
        self.assertEqual(result[0]['date'], '2026-08-12T10:05:00')
        self.assertFalse(result[0]['is_merge_commit'])
        cursor.execute.assert_called_once()

    @patch.object(service, 'connection')
    def test_commit_counts_use_owner_and_repo_key(self, connection):
        cursor = MagicMock()
        cursor.fetchall.return_value = [
            ('octocat', 'hello-world', 12),
            ('another', 'hello-world', 3),
        ]
        connection.cursor.return_value.__enter__.return_value = cursor

        result = service.get_commit_counts([
            ('octocat', 'hello-world'),
            ('another', 'hello-world'),
        ])

        self.assertEqual(result, {
            'octocat/hello-world': 12,
            'another/hello-world': 3,
        })

    def test_repository_parser_ignores_invalid_and_duplicate_items(self):
        self.assertEqual(
            _parse_repositories('octocat/hello-world,invalid,octocat/hello-world'),
            [('octocat', 'hello-world')],
        )

    def test_conventional_commit_colon_prefix_scores_one(self):
        accepted = ['feat: add login', 'fix(auth): refresh token', 'CI: pin action']
        for message in accepted:
            with self.subTest(message=message):
                self.assertEqual(service._compute_convention_score(message), 1)

    def test_bracket_or_plain_message_does_not_satisfy_convention(self):
        rejected = ['[기능] 로그인 추가', 'feat 로그인 추가', 'update']
        for message in rejected:
            with self.subTest(message=message):
                self.assertEqual(service._compute_convention_score(message), 0)

    def test_feature_prefix_gets_exact_feat_recommendation(self):
        score, status, reason = service._evaluate_convention(
            'feature: add user login API'
        )

        self.assertEqual((score, status), (0, 'unsatisfied'))
        self.assertEqual(
            reason,
            "'feature'는 표준이 아닙니다. 'feat:'을 권장합니다.",
        )
        self.assertNotIn('공백', reason)

        sentences = llm_client.CommitSentenceResponse(
            strengths=[], improvements=['다른 축의 보완점'], advice=[]
        )
        _, improvements = service._merge_convention_feedback(
            sentences, score, reason
        )
        self.assertEqual(improvements[-1], reason)
        self.assertNotIn('공백', ' '.join(improvements))

    def test_merge_commit_detection_is_case_insensitive(self):
        merge_messages = [
            "Merge branch 'main' into develop",
            'Merge pull request #42 from team/feature',
            'merge remote-tracking branch origin/main',
        ]
        for message in merge_messages:
            with self.subTest(message=message):
                self.assertTrue(service._is_merge_commit(message))
        self.assertFalse(service._is_merge_commit('feat: merge sorted arrays'))

    @patch.object(service.llm_client, 'summarize_commit_file')
    @patch.object(service.GithubCommitAiEvaluation.objects, 'get_or_create')
    @patch.object(service.llm_client, 'write_commit_sentences')
    @patch.object(service.llm_client, 'score_commit_consistency')
    @patch.object(service.llm_client, 'score_commit_atomicity')
    @patch.object(service.llm_client, 'score_commit_message')
    @patch.object(service, '_fetch_commit_files')
    @patch.object(service, '_get_commit')
    def test_merge_commit_skips_diff_and_all_llm_calls(
        self,
        get_commit,
        fetch_files,
        score_message,
        score_atomicity,
        score_consistency,
        write_sentences,
        get_or_create,
        summarize_commit_file,
    ):
        get_commit.return_value = {
            'sha': 'merge123',
            'message': "Merge branch 'main' into develop",
            'message_body': '',
            'author': 'octocat',
            'author_date': None,
            'committer_date': None,
            'date': None,
            'additions': 4000,
            'deletions': 700,
        }
        entity = MagicMock()
        entity.updated_at = None
        get_or_create.return_value = (entity, False)

        result = service.evaluate('octocat', 'hello-world', 'merge123')

        fetch_files.assert_not_called()
        score_message.assert_not_called()
        score_atomicity.assert_not_called()
        score_consistency.assert_not_called()
        write_sentences.assert_not_called()
        self.assertEqual(result['evaluation_status'], 'skipped')
        self.assertTrue(result['is_merge_commit'])
        self.assertEqual(result['skip_reason'], '머지 커밋은 평가 대상이 아닙니다.')
        self.assertIsNone(result['commit_score'])
        self.assertIsNone(result['commit_total_score'])
        self.assertEqual(entity.commit_breakdown['evaluation_status'], 'skipped')
        self.assertEqual(entity.commit_strengths, [])
        entity.save.assert_called_once()

    def test_300_file_commit_skips_all_llm_calls(self):
        commit = {
            'sha': 'large123',
            'message': 'feat: 대규모 파일 추가',
            'message_body': '',
            'author': 'octocat',
            'author_date': None,
            'committer_date': None,
            'date': None,
            'additions': 1000,
            'deletions': 0,
        }
        files = [
            {'filename': f'src/file_{index}.py', 'patch': '+new code'}
            for index in range(300)
        ]
        entity = MagicMock(updated_at=None)

        with (
            patch.object(service, '_get_commit', return_value=commit),
            patch.object(service, '_fetch_commit_files', return_value=files),
            patch.object(
                service.GithubCommitAiEvaluation.objects,
                'get_or_create',
                return_value=(entity, False),
            ),
            patch.object(service.llm_client, 'score_commit_message') as score_message,
            patch.object(service.llm_client, 'score_commit_atomicity') as score_atomicity,
            patch.object(service.llm_client, 'score_commit_consistency') as score_consistency,
            patch.object(service.llm_client, 'write_commit_sentences') as write_sentences,
        ):
            result = service.evaluate('octocat', 'hello-world', 'large123')

        score_message.assert_not_called()
        score_atomicity.assert_not_called()
        score_consistency.assert_not_called()
        write_sentences.assert_not_called()
        self.assertEqual(result['evaluation_status'], 'skipped')
        self.assertTrue(result['is_file_limit_exceeded'])
        self.assertEqual(result['file_count'], 300)
        self.assertEqual(
            result['skip_reason'],
            '변경 파일이 300개 이상인 커밋은 평가 대상이 아닙니다.',
        )
        self.assertIsNone(result['commit_score'])
        self.assertIsNone(result['commit_total_score'])
        self.assertEqual(entity.commit_breakdown['evaluation_status'], 'skipped')
        self.assertTrue(entity.commit_breakdown['is_file_limit_exceeded'])
        entity.save.assert_called_once()

    def test_existing_evaluation_is_hidden_when_file_response_reaches_300(self):
        commit = {
            'sha': 'large123',
            'message': 'feat: 대규모 파일 추가',
            'message_body': '',
        }
        files = [
            {'filename': f'src/file_{index}.py', 'patch': '+new code'}
            for index in range(300)
        ]
        entity = MagicMock(updated_at=None)

        with (
            patch.object(service, '_get_commit', return_value=commit),
            patch.object(service, '_fetch_commit_files', return_value=files),
            patch.object(
                service.GithubCommitAiEvaluation.objects,
                'get',
                return_value=entity,
            ),
        ):
            result = service.get_evaluation('octocat', 'hello-world', 'large123')

        self.assertEqual(result['evaluation_status'], 'skipped')
        self.assertEqual(result['file_count'], 300)
        self.assertTrue(result['is_file_limit_exceeded'])

    def test_generated_files_are_excluded_but_docs_and_config_are_not(self):
        files = [
            {'filename': 'package-lock.json'},
            {'filename': 'dist/app.min.js'},
            {'filename': 'api/generated/user_pb2.py'},
            {'filename': 'src/LoginService.java'},
            {'filename': 'README.md'},
            {'filename': '.gitignore'},
        ]

        generated, source = service._split_generated_files(files)

        self.assertEqual(
            [item['filename'] for item in generated],
            ['package-lock.json', 'dist/app.min.js', 'api/generated/user_pb2.py'],
        )
        self.assertEqual(
            [item['filename'] for item in source],
            ['src/LoginService.java', 'README.md', '.gitignore'],
        )

    def test_python_os_and_compiler_artifacts_are_excluded(self):
        generated_paths = [
            '__pycache__/service.cpython-311.pyc',
            'src/__pycache__/service.pyo',
            'module.pyc',
            'legacy.pyo',
            '.DS_Store',
            'src/Main.class',
            'obj/parser.o',
            '.pytest_cache/v/cache/nodeids',
            'src/.mypy_cache/3.11/module.meta.json',
        ]
        files = [
            *({'filename': path} for path in generated_paths),
            {'filename': 'src/service.py'},
        ]

        generated, source = service._split_generated_files(files)

        self.assertEqual(
            [item['filename'] for item in generated],
            generated_paths,
        )
        self.assertEqual(
            [item['filename'] for item in source],
            ['src/service.py'],
        )

    def test_ide_settings_directories_are_excluded(self):
        generated_paths = [
            '.idea/workspace.xml',
            'backend/.idea/modules.xml',
            '.vscode/settings.json',
            'frontend/.vscode/launch.json',
        ]
        files = [
            *({'filename': path} for path in generated_paths),
            {'filename': 'src/idea_formatter.py'},
            {'filename': 'docs/vscode-guide.md'},
        ]

        generated, source = service._split_generated_files(files)

        self.assertEqual(
            [item['filename'] for item in generated],
            generated_paths,
        )
        self.assertEqual(
            [item['filename'] for item in source],
            ['src/idea_formatter.py', 'docs/vscode-guide.md'],
        )

    def test_test_snapshots_are_excluded(self):
        files = [
            {'filename': 'src/components/__snapshots__/Button.test.js.snap'},
            {'filename': 'tests/results/parser.snap'},
            {'filename': 'tests/fixtures/case-1/analysis-snapshot.rust-debug'},
            {'filename': 'src/components/Button.test.jsx'},
            {'filename': 'src/snapshot-manager.ts'},
        ]

        generated, source = service._split_generated_files(files)

        self.assertEqual(
            [item['filename'] for item in generated],
            [
                'src/components/__snapshots__/Button.test.js.snap',
                'tests/results/parser.snap',
                'tests/fixtures/case-1/analysis-snapshot.rust-debug',
            ],
        )
        self.assertEqual(
            [item['filename'] for item in source],
            ['src/components/Button.test.jsx', 'src/snapshot-manager.ts'],
        )

    def test_changed_gitattributes_linguist_generated_pattern_is_respected(self):
        files = [
            {
                'filename': '.gitattributes',
                'patch': '@@ -0,0 +1 @@\n+generated/*.js linguist-generated=true',
            },
            {'filename': 'generated/client.js'},
            {'filename': 'src/client.js'},
        ]

        generated, source = service._split_generated_files(files)

        self.assertEqual(
            [item['filename'] for item in generated],
            ['generated/client.js'],
        )
        self.assertEqual(
            [item['filename'] for item in source],
            ['.gitattributes', 'src/client.js'],
        )

    def test_message_clarity_uses_what_as_gate(self):
        cases = [
            ('unsatisfied', 'satisfied', 0),
            ('satisfied', 'unsatisfied', 1),
            ('satisfied', 'satisfied', 2),
        ]
        for what, why, expected in cases:
            with self.subTest(what=what, why=why):
                result = llm_client.CommitMessageClarityResult(
                    what=what,
                    what_reason='변경 행위 파악 여부 근거',
                    why=why,
                    why_reason='변경 이유 존재 여부 근거',
                )
                self.assertEqual(service._compute_message_clarity_score(result), expected)

    @patch.object(service.llm_client, 'score_commit_atomicity')
    def test_single_source_file_skips_atomicity_llm(self, score_atomicity):
        result = service._evaluate_atomicity(
            'repo', 'abc1234', 'feat: add login', '',
            [{'filename': 'src/LoginService.java'}],
        )

        self.assertEqual(result[:2], (1, 'satisfied'))
        self.assertIsNone(result[3])
        score_atomicity.assert_not_called()

    @patch.object(service.llm_client, 'score_commit_atomicity')
    def test_multilayer_files_use_atomicity_llm_without_patch(self, score_atomicity):
        judged = llm_client.CriterionScore(result='satisfied', reason='한 기능의 여러 계층')
        judged._actual_model = 'claude-test'
        score_atomicity.return_value = judged
        files = [
            {'filename': 'model/Bookmark.java', 'patch': 'ignored'},
            {'filename': 'service/BookmarkService.java', 'patch': 'ignored'},
            {'filename': 'view/BookmarkList.jsx', 'patch': 'ignored'},
        ]

        result = service._evaluate_atomicity(
            'repo', 'abc1234', 'feat: add bookmark', '', files
        )

        self.assertEqual(
            result,
            (1, 'satisfied', '한 기능의 여러 계층', 'claude-test', 0.0),
        )
        passed_filenames = score_atomicity.call_args.args[4]
        self.assertEqual(passed_filenames, [item['filename'] for item in files])

    @patch.object(service.llm_client, 'score_commit_atomicity')
    def test_generated_only_and_large_commit_are_na(self, score_atomicity):
        generated_only = service._evaluate_atomicity('repo', 'sha', 'chore: lock', '', [])
        large = service._evaluate_atomicity(
            'repo', 'sha', 'chore: scaffold', '',
            [{'filename': f'src/file-{index}.js'} for index in range(31)],
        )

        self.assertEqual(generated_only[:2], (None, 'N/A'))
        self.assertEqual(large[:2], (None, 'N/A'))
        score_atomicity.assert_not_called()

    @patch.object(service.llm_client, 'score_commit_consistency')
    @patch.object(service.llm_client, 'count_text_tokens', return_value=120)
    def test_consistency_result_maps_to_zero_one_two(self, _count_tokens, score_consistency):
        clarity = llm_client.CommitMessageClarityResult(
            what='satisfied', what_reason='로그인 수정을 파악할 수 있음',
            why='unsatisfied', why_reason='변경 이유가 없음',
        )
        files = [
            {'filename': 'src/huge.py', 'patch': None},
            {
                'filename': 'src/login.py',
                'status': 'modified',
                'additions': 2,
                'deletions': 1,
                'patch': '@@ -1 +1 @@\n-old\n+new',
            },
        ]
        for result_name, expected_score in (
            ('matched', 2),
            ('partially_matched', 1),
            ('mismatched', 0),
        ):
            with self.subTest(result=result_name):
                judged = llm_client.CommitConsistencyResult(
                    result=result_name, reason='판정 근거'
                )
                judged._actual_model = 'claude-test'
                score_consistency.return_value = judged

                result = service._evaluate_consistency(
                    'repo', 'abc1234', 'fix: login', '', clarity, files
                )

                self.assertEqual(result[:4], (
                    expected_score, result_name, '판정 근거', 'claude-test'
                ))
                patch_text = score_consistency.call_args.args[4]
                self.assertIn('src/login.py', patch_text)
                self.assertIn('-old\n+new', patch_text)
                self.assertNotIn('src/huge.py', patch_text)
                self.assertEqual(result[5], 1)

    @patch.object(service.llm_client, 'score_commit_consistency')
    @patch.object(service.llm_client, 'count_text_tokens')
    def test_poor_message_skips_consistency_without_counting_patch(
        self, count_tokens, score_consistency
    ):
        clarity = llm_client.CommitMessageClarityResult(
            what='unsatisfied', what_reason='update만 있어 변경을 파악할 수 없음',
            why='unsatisfied', why_reason='변경 이유가 없음',
        )
        result = service._evaluate_consistency(
            'repo', 'sha', 'update', '', clarity,
            [{'filename': 'src/a.py', 'patch': '+print(1)'}],
        )

        self.assertEqual(result[:2], (None, 'N/A'))
        count_tokens.assert_not_called()
        score_consistency.assert_not_called()

    @patch.object(service.llm_client, 'score_commit_consistency')
    def test_none_patch_is_excluded_and_empty_patch_set_is_na(self, score_consistency):
        clarity = llm_client.CommitMessageClarityResult(
            what='satisfied', what_reason='로그인 수정을 파악할 수 있음',
            why='unsatisfied', why_reason='변경 이유가 없음',
        )
        result = service._evaluate_consistency(
            'repo', 'sha', 'fix: login', '', clarity,
            [
                {'filename': 'large.py', 'patch': None},
                {'filename': 'image.png'},
            ],
        )

        self.assertEqual(result[:2], (None, 'N/A'))
        self.assertEqual(result[5], 0)
        score_consistency.assert_not_called()

    @patch.object(service.llm_client, 'score_commit_consistency')
    @patch.object(service.llm_client, 'count_text_tokens', return_value=301)
    def test_oversized_patch_is_na_and_does_not_call_llm(
        self, _count_tokens, score_consistency
    ):
        clarity = llm_client.CommitMessageClarityResult(
            what='satisfied', what_reason='로그인 추가를 파악할 수 있음',
            why='unsatisfied', why_reason='변경 이유가 없음',
        )
        with patch.object(service.settings, 'COMMIT_CONSISTENCY_MAX_TOKENS', 300):
            result = service._evaluate_consistency(
                'repo', 'sha', 'feat: login', '', clarity,
                [{'filename': 'src/a.py', 'patch': '+new code'}],
            )

        self.assertEqual(result[:2], (None, 'N/A'))
        self.assertIn('더 작은 단위로 나누면', result[2])
        self.assertEqual(result[4], 301)
        score_consistency.assert_not_called()

    def test_file_summary_cache_hit_reuses_saved_result(self):
        cached_summaries = {
            'src/login.py': {
                'status': 'summarized',
                'summary': '로그인 처리 조건을 변경함',
            }
        }
        cache = MagicMock(summaries=cached_summaries, updated_at=None)
        with (
            patch.object(service, '_get_commit', return_value={
                'sha': 'abc1234', 'message': 'fix: login', 'message_body': '',
            }),
            patch.object(
                service.GithubCommitFileSummaryCache.objects,
                'get',
                return_value=cache,
            ),
            patch.object(service, '_fetch_commit_files') as fetch_files,
            patch.object(service.llm_client, 'summarize_commit_file') as summarize,
        ):
            result = service.get_or_create_file_summaries(
                'octocat', 'repo', 'abc1234'
            )

        self.assertTrue(result['cache_hit'])
        self.assertEqual(result['summaries'], cached_summaries)
        fetch_files.assert_not_called()
        summarize.assert_not_called()

    def test_file_summaries_parallel_path_labels_skips_and_does_not_score(self):
        files = [
            {'filename': 'dist/app.min.js', 'patch': '+generated'},
            {'filename': 'assets/logo.png', 'patch': None},
            {'filename': 'src/huge.py', 'patch': '+huge change'},
            {'filename': 'src/login.py', 'patch': '-old\n+new'},
            {'filename': 'src/session.py', 'patch': '-before\n+after'},
        ]

        def token_count(text, model=None):
            return 7000 if 'huge change' in text else 20

        def summarize(_repo, _sha, filename, _patch):
            return llm_client.CommitFileSummaryResponse(
                summary=f'{filename}\n변경 내용을 요약함'
            )

        cache = MagicMock(updated_at=None)
        with (
            patch.object(service, '_get_commit', return_value={
                'sha': 'abc1234', 'message': 'fix: login', 'message_body': '',
            }),
            patch.object(
                service.GithubCommitFileSummaryCache.objects,
                'get',
                side_effect=service.GithubCommitFileSummaryCache.DoesNotExist,
            ),
            patch.object(
                service.GithubCommitFileSummaryCache.objects,
                'update_or_create',
                return_value=(cache, True),
            ) as update_cache,
            patch.object(service, '_fetch_commit_files', return_value=files),
            patch.object(
                service.llm_client, 'count_text_tokens', side_effect=token_count
            ),
            patch.object(
                service.llm_client, 'summarize_commit_file', side_effect=summarize
            ) as summarize_file,
            patch.object(service.llm_client, 'score_commit_consistency') as score_consistency,
            patch.object(service.settings, 'COMMIT_FILE_SUMMARY_MAX_TOKENS', 6000),
            patch.object(service.settings, 'COMMIT_FILE_SUMMARY_MAX_WORKERS', 8),
        ):
            result = service.get_or_create_file_summaries(
                'octocat', 'repo', 'abc1234'
            )

        summaries = result['summaries']
        self.assertFalse(result['cache_hit'])
        self.assertEqual(summaries['dist/app.min.js']['status'], 'generated')
        self.assertEqual(summaries['assets/logo.png']['status'], 'unavailable')
        self.assertEqual(summaries['src/huge.py']['status'], 'too_large')
        self.assertEqual(summaries['src/login.py']['status'], 'summarized')
        self.assertNotIn('\n', summaries['src/login.py']['summary'])
        self.assertEqual(summarize_file.call_count, 2)
        score_consistency.assert_not_called()
        saved = update_cache.call_args.kwargs['defaults']['summaries']
        self.assertEqual(saved, summaries)

    @patch.object(service.llm_client, 'summarize_commit_file')
    @patch.object(service.GithubCommitAiEvaluation.objects, 'get_or_create')
    @patch.object(service.llm_client, 'write_commit_sentences')
    @patch.object(service.llm_client, 'score_commit_consistency')
    @patch.object(service.llm_client, 'count_text_tokens', return_value=120)
    @patch.object(service.llm_client, 'score_commit_atomicity')
    @patch.object(service.llm_client, 'score_commit_message')
    @patch.object(service, '_fetch_commit_files')
    @patch.object(service, '_get_commit')
    def test_evaluate_saves_all_axes_and_final_grade(
        self,
        get_commit,
        fetch_files,
        score_message,
        score_atomicity,
        _count_tokens,
        score_consistency,
        write_sentences,
        get_or_create,
        summarize_commit_file,
    ):
        get_commit.return_value = {
            'sha': 'abc1234',
            'message': 'feat: 로그인 세션 수정',
            'message_body': '',
            'author': 'octocat',
            'author_date': None,
            'committer_date': None,
            'date': None,
            'additions': 5,
            'deletions': 2,
        }
        fetch_files.return_value = [{
            'filename': 'src/LoginService.java',
            'status': 'modified',
            'additions': 5,
            'deletions': 2,
            'patch': '@@ -1 +1 @@\n-old session\n+fixed session',
        }]
        message_result = llm_client.CommitMessageScoreResponse(
            message_clarity={
                'what': 'satisfied',
                'what_reason': '로그인 세션 수정임을 파악할 수 있습니다.',
                'why': 'unsatisfied',
                'why_reason': '변경 이유나 배경이 작성되지 않았습니다.',
            }
        )
        message_result._actual_model = 'claude-test'
        message_result._actual_cost = 0.001
        score_message.return_value = message_result
        consistency_result = llm_client.CommitConsistencyResult(
            result='matched', reason='로그인 세션 수정 방향이 일치합니다.'
        )
        consistency_result._actual_model = 'claude-test'
        consistency_result._actual_cost = 0.003
        score_consistency.return_value = consistency_result
        sentence_result = llm_client.CommitSentenceResponse(
            strengths=[
                '변경 대상이 구체적입니다.',
                '메시지와 변경 방향이 일치합니다.',
            ],
            improvements=['변경 이유를 본문에 작성해 주세요.'],
            advice=['본문에 변경 배경을 한 문장으로 적어 보세요.'],
        )
        sentence_result._actual_cost = 0.004
        write_sentences.return_value = sentence_result
        entity = MagicMock()
        entity.updated_at = None
        get_or_create.return_value = (entity, True)

        with patch.object(service.logger, 'info') as log_info:
            result = service.evaluate('octocat', 'hello-world', 'abc1234')

        summarize_commit_file.assert_not_called()
        score_atomicity.assert_not_called()
        consistency_patch = score_consistency.call_args.args[4]
        self.assertIn('-old session\n+fixed session', consistency_patch)
        self.assertEqual(entity.commit_total_score, 5)
        self.assertEqual(entity.commit_score, 'A+')
        self.assertEqual(entity.consistency_score, 2)
        self.assertEqual(entity.atomicity_score, 1)
        self.assertEqual(entity.convention_score, 1)
        self.assertEqual(
            entity.commit_breakdown['message_clarity_what_reason'],
            '로그인 세션 수정임을 파악할 수 있습니다.',
        )
        self.assertEqual(
            entity.commit_breakdown['message_clarity_why_reason'],
            '변경 이유나 배경이 작성되지 않았습니다.',
        )
        self.assertEqual(
            entity.commit_breakdown['convention_reason'],
            "표준 Conventional Commits 타입 접두사 'feat:'을 사용했습니다.",
        )
        self.assertEqual(entity.model_name, 'claude-test')
        self.assertIn(
            "표준 Conventional Commits 타입 접두사 'feat:'을 사용했습니다.",
            entity.commit_strengths,
        )
        sentence_good_items = write_sentences.call_args.args[5]
        sentence_bad_items = write_sentences.call_args.args[6]
        self.assertEqual(
            sentence_good_items[0]['reason'],
            '로그인 세션 수정임을 파악할 수 있습니다.',
        )
        self.assertEqual(
            sentence_bad_items[0]['reason'],
            '변경 이유나 배경이 작성되지 않았습니다.',
        )
        self.assertFalse(any(
            'Conventional' in item['label']
            for item in sentence_good_items + sentence_bad_items
        ))
        self.assertEqual(entity.commit_missing, [])
        entity.save.assert_called_once()
        self.assertFalse(result['is_provisional'])
        self.assertEqual(result['commit_max_score'], 6)
        cost_log = next(
            call for call in log_info.call_args_list
            if str(call.args[0]).startswith('[LLM 총 비용]')
        )
        self.assertEqual(cost_log.args[4], 0.008)
        self.assertEqual(cost_log.args[5:], (0.001, 0.0, 0.003, 0.004))
