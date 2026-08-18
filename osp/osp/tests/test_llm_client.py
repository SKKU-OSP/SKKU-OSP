from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

from osp import llm_client


class LlmFallbackConfigurationTest(TestCase):
    def test_commit_message_prompt_anchors_plain_but_clear_what(self):
        prompt = llm_client._build_commit_message_system('repo')

        self.assertIn('상세함은 기준이 아닙니다', prompt)
        self.assertIn('collect commit message bodies', prompt)
        self.assertIn('add user login API', prompt)
        self.assertIn('fix pagination off-by-one', prompt)
        self.assertIn('what은 satisfied', prompt)
        self.assertIn('why는 unsatisfied', prompt)
        self.assertIn('what_reason', prompt)
        self.assertIn('why_reason', prompt)

    def test_commit_sentence_prompt_includes_reasons_and_forbids_guessing(self):
        good_items = [
            {'label': '변경 내용', 'reason': '로그인 API 추가가 명시됨'}
        ]
        bad_items = [
            {'label': '변경 이유', 'reason': '이유나 배경이 작성되지 않음'}
        ]
        data_block = llm_client._format_commit_sentence_items(
            good_items, bad_items
        )
        system_prompt = llm_client._build_commit_sentence_system(
            'repo', good_items, bad_items, 1, 1
        )

        self.assertIn('판정 근거: 로그인 API 추가가 명시됨', data_block)
        self.assertIn('판정 근거: 이유나 배경이 작성되지 않음', data_block)
        self.assertIn('추측하거나 지어내지 마세요', system_prompt)
        self.assertIn('콜론 뒤 공백에 관한 내용을 작성하지 마세요', system_prompt)
        self.assertNotIn('로그인 API 추가가 명시됨', system_prompt)

    @patch.object(llm_client, '_call_and_parse')
    def test_commit_sentence_reasons_are_passed_as_user_data(self, call_and_parse):
        call_and_parse.return_value = llm_client.CommitSentenceResponse(
            strengths=['잘한 점'], improvements=['보완점'], advice=[]
        )

        llm_client.write_commit_sentences(
            'repo', 'abc1234', 'feature: add login', '', ['src/login.py'],
            [{'label': '변경 내용', 'reason': '로그인 추가를 파악할 수 있음'}],
            [{'label': '변경 이유', 'reason': '변경 이유가 없음'}],
        )

        system_prompt, user_prompt = call_and_parse.call_args.args[:2]
        self.assertNotIn('로그인 추가를 파악할 수 있음', system_prompt)
        self.assertIn('[JUDGEMENT_RESULTS]', user_prompt)
        self.assertIn('판정 근거: 로그인 추가를 파악할 수 있음', user_prompt)
        self.assertIn('판정 근거: 변경 이유가 없음', user_prompt)

    @patch.object(llm_client, '_call_and_parse')
    def test_commit_file_summary_uses_haiku_route(self, call_and_parse):
        expected = object()
        call_and_parse.return_value = expected

        result = llm_client.summarize_commit_file(
            'repo', 'abc1234', 'src/login.py', '-old\n+new'
        )

        self.assertIs(result, expected)
        kwargs = call_and_parse.call_args.kwargs
        self.assertEqual(kwargs['model'], llm_client.COMMIT_FILE_SUMMARY_MODEL)
        self.assertEqual(
            kwargs['fallbacks'], llm_client.COMMIT_FILE_SUMMARY_FALLBACKS
        )
        self.assertEqual(kwargs['temperature'], 0.2)

    @patch.object(llm_client, '_call_and_parse')
    def test_commit_consistency_uses_sonnet_specific_route(self, call_and_parse):
        expected = object()
        call_and_parse.return_value = expected

        result = llm_client.score_commit_consistency(
            'repo', 'abc1234', 'fix: login', '',
            '=== FILE: login.py ===\n-old\n+new',
        )

        self.assertIs(result, expected)
        kwargs = call_and_parse.call_args.kwargs
        self.assertEqual(kwargs['model'], llm_client.COMMIT_CONSISTENCY_MODEL)
        self.assertEqual(
            kwargs['fallbacks'], llm_client.COMMIT_CONSISTENCY_FALLBACKS
        )
        self.assertEqual(kwargs['temperature'], 0.0)

    @patch.object(llm_client.litellm, 'completion_cost', return_value=0.001)
    @patch.object(llm_client.litellm, 'cost_per_token', return_value=(0.001, 0.001))
    @patch.object(llm_client.litellm, 'token_counter', return_value=10)
    @patch.object(llm_client.litellm, 'completion')
    def test_completion_uses_runtime_fallback_and_provider_env_keys(
        self, completion, _token_counter, _cost_per_token, _completion_cost
    ):
        completion.return_value = SimpleNamespace(
            model=llm_client.LLM_FALLBACK_MODEL,
            usage=SimpleNamespace(prompt_tokens=10, completion_tokens=5),
            choices=[SimpleNamespace(message=SimpleNamespace(
                tool_calls=[SimpleNamespace(function=SimpleNamespace(
                    name='submit_test',
                    arguments='{"result":"satisfied","reason":"ok"}',
                ))],
            ))],
        )

        content, actual_model = llm_client._call_llm(
            'system', 'user', 0.0,
            output_model=llm_client.CriterionScore,
            tool_name='submit_test',
            label='test',
        )

        self.assertEqual(
            content, '{"result":"satisfied","reason":"ok"}'
        )
        self.assertEqual(actual_model, llm_client.LLM_FALLBACK_MODEL)
        kwargs = completion.call_args.kwargs
        self.assertEqual(kwargs['model'], llm_client.LLM_MODEL)
        self.assertEqual(kwargs['fallbacks'], llm_client.LLM_FALLBACKS)
        self.assertEqual(kwargs['num_retries'], llm_client.LLM_NUM_RETRIES)
        self.assertEqual(kwargs['timeout'], llm_client.LLM_TIMEOUT)
        self.assertNotIn('api_key', kwargs)

    @patch.object(llm_client, '_call_llm')
    def test_transport_error_is_not_retried_outside_litellm(self, call_llm):
        call_llm.side_effect = TimeoutError('provider timeout')

        with self.assertRaises(TimeoutError):
            llm_client._call_and_parse(
                'system', 'user', 0.0, llm_client.ScoreResponse,
                tool_name='submit_readme_score',
                max_attempts=2, label='test',
            )

        call_llm.assert_called_once()

    @patch.object(llm_client, '_call_llm')
    def test_parsed_response_contains_actual_model(self, call_llm):
        call_llm.return_value = (
            '{"result":"satisfied","reason":"ok"}',
            llm_client.LLM_FALLBACK_MODEL,
        )

        result = llm_client._call_and_parse(
            'system', 'user', 0.0, llm_client.CriterionScore,
            tool_name='submit_test',
            label='test',
        )

        self.assertEqual(result.actual_model, llm_client.LLM_FALLBACK_MODEL)

    @patch.object(llm_client.litellm, 'completion_cost', return_value=0.001)
    @patch.object(llm_client.litellm, 'cost_per_token', return_value=(0.001, 0.001))
    @patch.object(llm_client.litellm, 'token_counter', return_value=10)
    @patch.object(llm_client.litellm, 'completion')
    def test_forced_tool_call_uses_pydantic_schema_and_extracts_arguments(
        self, completion, _token_counter, _cost_per_token, _completion_cost
    ):
        arguments = '{"issue_type":"skip"}'
        completion.return_value = SimpleNamespace(
            model=llm_client.LLM_FALLBACK_MODEL,
            usage=SimpleNamespace(prompt_tokens=10, completion_tokens=5),
            choices=[SimpleNamespace(message=SimpleNamespace(
                content=None,
                tool_calls=[SimpleNamespace(function=SimpleNamespace(
                    name='submit_issue_score',
                    arguments=arguments,
                ))],
            ))],
        )

        raw, actual_model = llm_client._call_llm(
            'system',
            'user',
            0.0,
            output_model=llm_client.IssueScoreResponse,
            tool_name='submit_issue_score',
        )

        self.assertEqual(raw, arguments)
        self.assertEqual(actual_model, llm_client.LLM_FALLBACK_MODEL)
        kwargs = completion.call_args.kwargs
        self.assertNotIn('response_format', kwargs)
        self.assertFalse(kwargs['parallel_tool_calls'])
        self.assertEqual(
            kwargs['tool_choice'],
            {
                'type': 'function',
                'function': {'name': 'submit_issue_score'},
            },
        )
        self.assertEqual(
            kwargs['tools'][0]['function']['parameters'],
            llm_client.IssueScoreResponse.model_json_schema(),
        )

    def test_issue_schema_rejects_unknown_fields(self):
        with self.assertRaises(ValueError):
            llm_client.IssueScoreResponse.model_validate({
                'issue_type': 'skip',
                'admin_score': 100,
            })

    def test_all_output_schemas_forbid_unknown_fields(self):
        output_models = (
            llm_client.ScoreResponse,
            llm_client.SentenceResponse,
            llm_client.PrScoreResponse,
            llm_client.PrSentenceResponse,
            llm_client.IssueScoreResponse,
            llm_client.IssueSentenceResponse,
            llm_client.CommitMessageScoreResponse,
            llm_client.CommitConsistencyResult,
            llm_client.CommitFileSummaryResponse,
            llm_client.CommitSentenceResponse,
        )

        for output_model in output_models:
            with self.subTest(output_model=output_model.__name__):
                self.assertFalse(
                    output_model.model_json_schema()['additionalProperties']
                )

    @patch.object(llm_client, '_call_llm')
    def test_tool_arguments_do_not_use_code_fence_cleanup(self, call_llm):
        call_llm.return_value = (
            '```json\n{"issue_type":"skip"}\n```',
            llm_client.LLM_MODEL,
        )

        with self.assertRaises(llm_client.LlmResponseParseError):
            llm_client._call_and_parse(
                'system',
                'user',
                0.0,
                llm_client.IssueScoreResponse,
                max_attempts=1,
                tool_name='submit_issue_score',
            )
