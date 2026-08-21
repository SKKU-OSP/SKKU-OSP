from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

from osp import llm_client
from osp import issue_evaluation_service


class LlmFallbackConfigurationTest(TestCase):
    def test_readme_sentence_prompt_includes_judgment_reasons(self):
        prompt = llm_client._build_sentence_system(
            'repo',
            [{
                'label': '명확성',
                'good': ['프로젝트 목적'],
                'bad': ['사용 맥락'],
                'reason': '프로젝트 목적은 있지만 대상 사용자 설명은 없습니다.',
            }],
            [{
                'label': '협업',
                'satisfied': False,
                'reason': '기여 절차를 확인하지 못했습니다.',
            }],
            1,
            2,
        )

        self.assertIn('프로젝트 목적은 있지만 대상 사용자 설명은 없습니다.', prompt)
        self.assertIn('기여 절차를 확인하지 못했습니다.', prompt)
        self.assertIn('reason에 없는 성과, 누락 원인 또는 형식 문제를', prompt)

    @patch.object(llm_client, '_call_and_parse')
    def test_issue_sentence_receives_each_judgment_reason(self, call_and_parse):
        call_and_parse.return_value = llm_client.IssueSentenceResponse(
            strengths=['증상이 구체적으로 작성되었습니다.'],
            improvements=['재현 환경을 추가해 주세요.'],
            advice=[],
        )

        llm_client.write_issue_sentences(
            'repo', 1, '로그인 오류', '로그인 시 500 오류가 발생합니다.',
            [{'label': '버그 증상 설명', 'reason': '500 오류 증상이 명시되었습니다.'}],
            [{'label': '재현/환경 정보', 'reason': '실행 환경이 작성되지 않았습니다.'}],
            issue_type='bug',
        )

        system_prompt, user_prompt = call_and_parse.call_args.args[:2]
        self.assertIn('JUDGEMENT_RESULTS', user_prompt)
        self.assertIn('500 오류 증상이 명시되었습니다.', user_prompt)
        self.assertIn('실행 환경이 작성되지 않았습니다.', user_prompt)
        self.assertIn('reason에 없는 성과, 누락 원인 또는 형식 문제를', system_prompt)

    def test_issue_sentence_inputs_preserve_score_reasons(self):
        fulfilment = llm_client.IssueFulfilmentResult(
            what='satisfied', what_reason='증상이 구체적으로 작성되었습니다.',
            why='unsatisfied', why_reason='재현 환경이 없습니다.',
            verification='satisfied', verification_reason='기대 동작이 작성되었습니다.',
        )
        clarity = llm_client.PrClarityResult(
            title_specificity='satisfied', title_specificity_reason='제목이 구체적입니다.',
            title_body_match='satisfied', title_body_match_reason='제목과 본문이 일치합니다.',
            single_focus='satisfied', single_focus_reason='하나의 오류에 집중합니다.',
        )

        good, bad = issue_evaluation_service._build_sentence_inputs(
            fulfilment, clarity, 'bug', ['제목 태그'], ['재현 자료'],
        )

        self.assertEqual(good[0]['reason'], '증상이 구체적으로 작성되었습니다.')
        self.assertEqual(bad[0]['reason'], '재현 환경이 없습니다.')
        self.assertTrue(all(set(item) == {'label', 'reason'} for item in good + bad))

    def test_pr_and_issue_prompts_require_judgment_reasons(self):
        fulfilment_prompt = llm_client._build_pr_what_verification_system('repo')
        why_prompt = llm_client._build_pr_why_system('repo')
        clarity_prompt = llm_client._build_pr_clarity_system(
            'repo', body_present=True
        )
        issue_prompt = llm_client._build_issue_score_system(
            'repo', body_present=True
        )

        for reason_field in ('what_reason', 'verification_reason'):
            self.assertIn(reason_field, fulfilment_prompt)
            self.assertIn(reason_field, issue_prompt)
        self.assertIn('evidence_quote', why_prompt)
        self.assertIn('reason', why_prompt)
        self.assertIn('why_reason', issue_prompt)
        for reason_field in (
            'title_specificity_reason',
            'title_body_match_reason',
            'single_focus_reason',
        ):
            self.assertIn(reason_field, clarity_prompt)
            self.assertIn(reason_field, issue_prompt)
        self.assertIn('issue_type_reason', issue_prompt)

    def test_pr_fulfilment_prompt_does_not_confuse_what_with_why(self):
        prompt = llm_client._build_pr_why_system('repo')

        self.assertIn('기술 이동 방향은 Why가 아닙니다', prompt)
        self.assertIn('Django로 이관하고', prompt)
        self.assertIn('왜 이 변경이 필요했는가', prompt)
        self.assertIn('작업 목록이 아무리 상세해도', prompt)
        self.assertIn('빈 문자열이고 result는 unsatisfied', prompt)
        self.assertIn('무의미한 색상 표현 대신', prompt)
        self.assertIn('문장 전체의 의미', prompt)

    def test_judgment_log_contains_result_reason_and_model_on_one_line(self):
        with self.assertLogs('osp.llm_client', level='INFO') as captured:
            llm_client.log_judgment(
                'octocat/repo#1 | PR',
                'what',
                'satisfied',
                '로그인 API를\n추가한다고 명시했습니다.',
                'claude-test',
            )

        message = captured.output[0]
        self.assertIn('criterion=what', message)
        self.assertIn('result=satisfied', message)
        self.assertIn('reason=로그인 API를 추가한다고 명시했습니다.', message)
        self.assertIn('model=claude-test', message)

    def test_commit_message_prompt_anchors_plain_but_clear_what(self):
        prompt = llm_client._build_commit_message_system('repo')

        self.assertIn('상세함은 기준이 아닙니다', prompt)
        self.assertIn('명확한 행위 동사', prompt)
        self.assertIn('식별 가능한', prompt)
        self.assertIn('Add YOLOPv2', prompt)
        self.assertIn('고유명사의 상세 의미', prompt)
        self.assertIn('행위만 있고 변경 대상이 없으면 unsatisfied', prompt)
        self.assertIn('collect commit message bodies', prompt)
        self.assertIn('add user login API', prompt)
        self.assertIn('fix pagination off-by-one', prompt)
        self.assertIn('what은 satisfied', prompt)
        self.assertIn('why는 unsatisfied', prompt)
        self.assertIn('what_reason', prompt)
        self.assertIn('why_reason', prompt)

    @patch.object(llm_client, '_call_and_parse')
    def test_commit_message_uses_dedicated_sonnet_model(self, call_and_parse):
        expected = llm_client.CommitMessageScoreResponse(
            message_clarity={
                'what': 'satisfied',
                'what_reason': 'YOLOPv2 추가 대상과 행위가 명확합니다.',
                'why': 'unsatisfied',
                'why_reason': '추가 이유나 배경은 없습니다.',
            }
        )
        call_and_parse.return_value = expected

        result = llm_client.score_commit_message(
            'repo', 'abc1234', 'Add YOLOPv2', ''
        )

        self.assertIs(result, expected)
        kwargs = call_and_parse.call_args.kwargs
        self.assertEqual(kwargs['model'], llm_client.COMMIT_MESSAGE_MODEL)
        self.assertEqual(kwargs['fallbacks'], llm_client.COMMIT_MESSAGE_FALLBACKS)

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

    def test_pr_consistency_agent_prompt_prioritizes_commits_within_budget(self):
        prompt = llm_client._build_pr_consistency_agent_system('repo')

        self.assertIn('남은 patch 토큰 예산을 고려하세요', prompt)
        self.assertIn('예산 안에서 확인 가능한 커밋을 우선 선택하세요', prompt)
        self.assertIn('주요 작업마다 실제 diff 근거', prompt)
        self.assertIn('실제 변경의 증거로 인정하지 마세요', prompt)
        self.assertIn('finish를 선택하지 마세요', prompt)
        self.assertIn('반드시 500자 이내로 작성하세요', prompt)

    def test_pr_consistency_final_prompt_separates_summaries_from_scoring(self):
        prompt = llm_client._build_pr_consistency_final_system('repo')

        self.assertIn('판정 결론만 사용자용 한두 문장', prompt)
        self.assertIn('3~5개의 짧은 한국어 항목', prompt)
        self.assertIn('파일명·클래스명·함수명을 길게 나열하지 마세요', prompt)
        self.assertIn('commit_summaries는 표시용이며 판정 결과에 영향을 주지 않습니다', prompt)
        self.assertIn('status가 success인 각 커밋', prompt)
        self.assertIn('PR의 주요 주장 모두가 관찰한 patch에서 확인', prompt)
        self.assertIn('설명한 변경 중 일부만 실제로 존재할 때만', prompt)
        self.assertIn('실제로 작동하는지, 제대로 호출되는지', prompt)
        self.assertIn('close 함수가 추가됐지만 클래스 외부에 있어 호출되지 않는다', prompt)
        self.assertIn('구현이 불완전하거나', prompt)
        self.assertIn('여전히 matched', prompt)
        self.assertIn('코드 품질·결함·동작 가능성에 대한 평가를 쓰지 마세요', prompt)
        self.assertIn('선택되지 않은 커밋에 해당 변경이 없다고 단정하지 마세요', prompt)
        self.assertIn('명시적 주장에 대한 patch 근거가 관찰되지 않았다면 matched로 판정하지 마세요', prompt)
        self.assertIn('mismatched는 실제로 관찰한 patch', prompt)

    def test_pr_consistency_decision_allows_reason_up_to_1000_chars(self):
        result = llm_client.PrConsistencyAgentDecision(
            action='finish', reason='가' * 1000
        )

        self.assertEqual(len(result.reason), 1000)

        with self.assertRaises(ValueError):
            llm_client.PrConsistencyAgentDecision(
                action='finish', reason='가' * 1001
            )

    def test_pr_cohesion_prompts_allow_zero_fetch_and_forbid_quality_review(self):
        agent_prompt = llm_client._build_pr_cohesion_agent_system('repo')
        final_prompt = llm_client._build_pr_cohesion_final_system('repo')

        self.assertIn('diff를 한 번도 조회하지 않고 즉시 finish', agent_prompt)
        self.assertIn('제목이 애매하거나 무관해 보이는 커밋만', agent_prompt)
        self.assertIn('여러 계층으로 나눈 커밋들은 응집적', agent_prompt)
        self.assertIn('PR 본문, 다른 커밋 제목, 커밋 순서와 함께', agent_prompt)
        self.assertIn('제목이 짧아도 finish할 수 있습니다', agent_prompt)
        self.assertIn('결론이 달라질 수 있는 커밋에만 사용하세요', agent_prompt)
        self.assertIn('데모나 형식적인 탐색을 위해 조회하지 마세요', agent_prompt)
        self.assertIn('이 diff를 보지 않아도 관련성 결론에 충분히 확신하는가', agent_prompt)
        self.assertIn('애매하면 반드시 cohesive', final_prompt)
        self.assertIn('소수의 곁가지가 있어도 cohesive', final_prompt)
        self.assertIn('코드 품질, 버그, 구조 오류, 작동 여부', final_prompt)
        self.assertIn('제목 기준으로 판단', final_prompt)
        self.assertIn('하나의 목적과 행정적 묶음의 구분', final_prompt)
        self.assertIn('버전 릴리즈', final_prompt)
        self.assertIn('무관한 작업을 담는 행정적 그릇', final_prompt)
        self.assertIn('로그인·인증 수정 + 탈퇴 사용자 게시글 버그', final_prompt)
        self.assertIn('릴리즈 번호나 배포 일정이 공통이라는 이유로 cohesive', final_prompt)
        self.assertIn('다계층과 다기능의 구분', final_prompt)
        self.assertIn('기능 자체가 여러 개인 경우는 scattered', final_prompt)
        self.assertIn('서로 독립적인 기능군이 여러 개 확인되면', final_prompt)

    @patch.object(llm_client, '_call_and_parse')
    def test_pr_cohesion_agent_and_final_use_sonnet_route(self, call_and_parse):
        call_and_parse.side_effect = [object(), object()]

        llm_client.choose_pr_cohesion_action(
            'repo', 1, 'feat: login', 'body', [], [], 3, 60000
        )
        llm_client.score_pr_cohesion(
            'repo', 1, 'feat: login', 'body', [], []
        )

        for call in call_and_parse.call_args_list:
            self.assertEqual(call.kwargs['model'], llm_client.PR_COHESION_MODEL)
            self.assertEqual(
                call.kwargs['fallbacks'], llm_client.PR_COHESION_FALLBACKS
            )
            self.assertEqual(call.kwargs['temperature'], 0.0)
        self.assertEqual(
            call_and_parse.call_args_list[0].kwargs['tool_name'],
            'choose_pr_cohesion_action',
        )
        self.assertEqual(
            call_and_parse.call_args_list[1].kwargs['tool_name'],
            'submit_pr_cohesion_score',
        )

    @patch.object(llm_client, '_call_and_parse')
    def test_pr_consistency_agent_and_final_use_sonnet_route(self, call_and_parse):
        call_and_parse.side_effect = [object(), object()]

        llm_client.choose_pr_consistency_action(
            'repo', 1, 'feat: login', 'body', [], [], 3, 30000
        )
        llm_client.score_pr_consistency(
            'repo', 1, 'feat: login', 'body', []
        )

        for call in call_and_parse.call_args_list:
            kwargs = call.kwargs
            self.assertEqual(kwargs['model'], llm_client.COMMIT_CONSISTENCY_MODEL)
            self.assertEqual(
                kwargs['fallbacks'], llm_client.COMMIT_CONSISTENCY_FALLBACKS
            )
            self.assertEqual(kwargs['temperature'], 0.0)

        self.assertEqual(
            call_and_parse.call_args_list[0].kwargs['tool_name'],
            'choose_pr_consistency_action',
        )
        self.assertEqual(
            call_and_parse.call_args_list[1].kwargs['tool_name'],
            'submit_pr_consistency_score',
        )

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

        content, actual_model, actual_cost = llm_client._call_llm(
            'system', 'user', 0.0,
            output_model=llm_client.CriterionScore,
            tool_name='submit_test',
            label='test',
        )

        self.assertEqual(
            content, '{"result":"satisfied","reason":"ok"}'
        )
        self.assertEqual(actual_model, llm_client.LLM_FALLBACK_MODEL)
        self.assertEqual(actual_cost, 0.001)
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
            0.002,
        )

        result = llm_client._call_and_parse(
            'system', 'user', 0.0, llm_client.CriterionScore,
            tool_name='submit_test',
            label='test',
        )

        self.assertEqual(result.actual_model, llm_client.LLM_FALLBACK_MODEL)
        self.assertEqual(result.actual_cost, 0.002)

    @patch.object(llm_client, '_call_llm')
    def test_parse_retry_adds_validation_feedback(self, call_llm):
        call_llm.side_effect = [
            ('{"result":"invalid","reason":"too long"}', 'claude-test', 0.001),
            ('{"result":"satisfied","reason":"ok"}', 'claude-test', 0.002),
        ]

        result = llm_client._call_and_parse(
            'system', 'original user prompt', 0.0,
            llm_client.CriterionScore,
            tool_name='submit_test', max_attempts=2, label='retry-test',
        )

        self.assertEqual(result.result, 'satisfied')
        self.assertEqual(result.actual_cost, 0.003)
        first_user_prompt = call_llm.call_args_list[0].args[1]
        retry_user_prompt = call_llm.call_args_list[1].args[1]
        self.assertEqual(first_user_prompt, 'original user prompt')
        self.assertIn('original user prompt', retry_user_prompt)
        self.assertIn('[RETRY_VALIDATION_FEEDBACK]', retry_user_prompt)
        self.assertIn('같은 응답을 반복하지 마세요', retry_user_prompt)
        self.assertIn('문자열은 핵심만 짧게 작성', retry_user_prompt)

    @patch.object(llm_client, '_call_llm')
    def test_pr_score_calls_fulfilment_and_clarity_separately(self, call_llm):
        call_llm.side_effect = [
            (
                '{"what":"satisfied","what_reason":"변경 내용이 명시됨",'
                '"verification":"unsatisfied",'
                '"verification_reason":"검증 방법이 없음"}',
                'claude-haiku-test',
            ),
            (
                '{"result":"satisfied",'
                '"evidence_quote":"가입자의 활동 반영을 위해 동기화가 필요해서",'
                '"reason":"활동 반영 문제와 동기화 필요성이 명시됨"}',
                'claude-haiku-test',
            ),
            (
                '{"title_specificity":"satisfied",'
                '"title_specificity_reason":"제목이 구체적임",'
                '"title_body_match":"satisfied",'
                '"title_body_match_reason":"제목과 본문이 일치함",'
                '"single_focus":"satisfied",'
                '"single_focus_reason":"하나의 목적에 집중함"}',
                'claude-haiku-test',
            ),
        ]

        result = llm_client.score_pr(
            'repo', 1, 'feat: 로그인 동기화',
            '가입자의 활동 반영을 위해 동기화가 필요해서', True,
        )

        self.assertEqual(result.fulfilment.what, 'satisfied')
        self.assertEqual(result.fulfilment.why, 'satisfied')
        self.assertEqual(result.clarity.title_specificity, 'satisfied')
        self.assertEqual(result.actual_model, 'claude-haiku-test')
        self.assertEqual(call_llm.call_count, 3)
        self.assertIs(
            call_llm.call_args_list[0].kwargs['output_model'],
            llm_client.PrWhatVerificationResult,
        )
        self.assertIs(
            call_llm.call_args_list[1].kwargs['output_model'],
            llm_client.PrWhyResult,
        )
        self.assertIs(
            call_llm.call_args_list[2].kwargs['output_model'],
            llm_client.PrClarityResult,
        )
        self.assertEqual(
            call_llm.call_args_list[0].kwargs['tool_name'],
            'submit_pr_what_verification',
        )
        self.assertEqual(
            call_llm.call_args_list[1].kwargs['tool_name'],
            'submit_pr_why',
        )
        self.assertEqual(
            call_llm.call_args_list[2].kwargs['tool_name'],
            'submit_pr_clarity',
        )
        self.assertEqual(
            call_llm.call_args_list[1].kwargs['model'],
            llm_client.PR_WHY_MODEL,
        )
        self.assertEqual(
            call_llm.call_args_list[2].kwargs['model'],
            llm_client.LLM_MODEL,
        )

    @patch.object(llm_client, '_call_llm')
    def test_pr_score_records_models_from_both_calls(self, call_llm):
        call_llm.side_effect = [
            ('{"what":"satisfied","what_reason":"변경 내용이 명시됨",'
            '"verification":"unsatisfied",'
            '"verification_reason":"검증 방법이 없음"}',
             'claude-haiku-test'),
            ('{"result":"unsatisfied","evidence_quote":"",'
             '"reason":"변경 이유가 없음"}', 'claude-sonnet-test'),
            ('{"title_specificity":"satisfied",'
            '"title_specificity_reason":"제목이 구체적임",'
            '"title_body_match":"satisfied",'
            '"title_body_match_reason":"제목과 본문이 일치함",'
            '"single_focus":"satisfied",'
            '"single_focus_reason":"하나의 목적에 집중함"}',
             'gemini-test'),
        ]

        result = llm_client.score_pr(
            'repo', 1, 'feat: 로그인 동기화', '본문', True,
        )

        self.assertEqual(result.clarity.single_focus, 'satisfied')
        self.assertEqual(
            result.actual_model,
            'claude-haiku-test|claude-sonnet-test|gemini-test',
        )
        self.assertEqual(call_llm.call_count, 3)

    def test_pr_why_empty_evidence_is_unsatisfied(self):
        result = llm_client.PrWhyResult(
            result='satisfied', evidence_quote='', reason='필요성이 있습니다.',
        )

        checked = llm_client._validate_pr_why_result(result, '기능을 추가했습니다.')

        self.assertEqual(checked.result, 'unsatisfied')

    def test_pr_478_sonnet_judgment_is_not_overridden_by_code(self):
        evidence = 'Spring Boot의 AI 평가 로직을 Django로 완전히 이관했습니다.'
        result = llm_client.PrWhyResult(
            result='unsatisfied', evidence_quote=evidence,
            reason='수행한 이관 작업만 있고 변경 목적은 없습니다.',
        )

        checked = llm_client._validate_pr_why_result(result, evidence)

        self.assertEqual(checked.result, 'unsatisfied')
        self.assertEqual(checked.reason, result.reason)

    def test_code_does_not_replace_semantic_judgment_for_valid_quote(self):
        evidence = '평가 로직을 Django로 이관했습니다.'
        result = llm_client.PrWhyResult(
            result='satisfied', evidence_quote=evidence,
            reason='테스트를 위해 의도적으로 넣은 모델 판정입니다.',
        )

        checked = llm_client._validate_pr_why_result(result, evidence)

        self.assertEqual(checked.result, 'satisfied')
        self.assertEqual(checked.reason, '테스트를 위해 의도적으로 넣은 모델 판정입니다.')

    def test_pr_why_accepts_direct_causal_quote(self):
        evidence = '기존 이중 구조가 유지보수를 어렵게 해서 구조 개선이 필요합니다.'
        result = llm_client.PrWhyResult(
            result='satisfied', evidence_quote=evidence,
            reason='유지보수 문제를 변경 배경으로 설명했습니다.',
        )

        checked = llm_client._validate_pr_why_result(result, evidence)

        self.assertEqual(checked.result, 'satisfied')

    def test_pr_463_goal_state_in_past_tense_is_satisfied(self):
        evidence = 'VIEW를 사용해 OSP 코드 변경을 최소화했습니다.'
        result = llm_client.PrWhyResult(
            result='satisfied', evidence_quote=evidence,
            reason='VIEW 방식을 선택한 목적이 코드 변경 최소화라고 설명했습니다.',
        )

        checked = llm_client._validate_pr_why_result(result, evidence)

        self.assertEqual(checked.result, 'satisfied')

    def test_pr_465_problem_relation_can_be_weak_why(self):
        evidence = '기존 요청에서 500 오류가 발생해서 예외 처리를 추가했습니다.'
        result = llm_client.PrWhyResult(
            result='satisfied', evidence_quote=evidence,
            reason='500 오류라는 해결 대상이 설명되어 있습니다.',
        )

        checked = llm_client._validate_pr_why_result(result, evidence)

        self.assertEqual(checked.result, 'satisfied')

    def test_error_fix_without_problem_relation_is_still_what(self):
        evidence = '500 에러 수정 로직을 구현했습니다.'
        result = llm_client.PrWhyResult(
            result='unsatisfied', evidence_quote=evidence,
            reason='수행한 수정 작업만 설명했습니다.',
        )

        checked = llm_client._validate_pr_why_result(result, evidence)

        self.assertEqual(checked.result, 'unsatisfied')

    def test_pr_447_problem_and_cause_sonnet_judgment_is_preserved(self):
        evidence = (
            '개발 서버에서 수집이 안되고 있었는데, '
            '도커에서 크롬을 설치하지 않아서 생긴 문제였습니다.'
        )
        result = llm_client.PrWhyResult(
            result='satisfied', evidence_quote=evidence,
            reason='수집 실패 문제와 크롬 미설치 원인이 설명되어 있습니다.',
        )

        checked = llm_client._validate_pr_why_result(result, evidence)

        self.assertEqual(checked.result, 'satisfied')

    def test_pr_423_problem_and_goal_sonnet_judgment_is_preserved(self):
        evidence = (
            '기존 무의미한 색상 표현 대신 개발자 오픈소스 커뮤니티에 '
            '적합하고 재미 요소를 갖춘 테스트로 변경했습니다.'
        )
        result = llm_client.PrWhyResult(
            result='satisfied', evidence_quote=evidence,
            reason='기존 표현의 문제와 커뮤니티 적합성이라는 목적이 설명되어 있습니다.',
        )

        checked = llm_client._validate_pr_why_result(result, evidence)

        self.assertEqual(checked.result, 'satisfied')

    def test_pr_why_rejects_quote_missing_from_body(self):
        result = llm_client.PrWhyResult(
            result='satisfied', evidence_quote='기존 구조에 문제가 있어서',
            reason='문제가 명시되었습니다.',
        )

        checked = llm_client._validate_pr_why_result(result, '기능을 추가합니다.')

        self.assertEqual(checked.result, 'unsatisfied')
        self.assertIn('본문에서 확인할 수 없습니다', checked.reason)

    @patch.object(llm_client, '_call_and_parse')
    def test_pr_sentence_uses_each_judgment_reason(self, call_and_parse):
        call_and_parse.return_value = llm_client.PrSentenceResponse(
            strengths=[
                '세션 만료 문제를 해결하려는 배경을 잘 설명했습니다.',
                '실제 변경이 설명과 일치합니다.',
            ],
            improvements=[],
            advice=['현재 작성 방식을 유지해 주세요.'],
        )

        llm_client.write_pr_sentences(
            'repo', 1, 'feat: 로그인 추가', '로그인 기능을 추가합니다.',
            [
                {'label': '변경 이유(Why)', 'reason': '세션 만료 문제를 해결하려는 배경이 있습니다.'},
                {'label': '변경 정합성', 'reason': '로그인 API 추가가 실제 diff에서 확인되었습니다.'},
            ],
            [],
        )

        system_prompt, user_prompt = call_and_parse.call_args.args[:2]
        self.assertIn('JUDGEMENT_RESULTS', user_prompt)
        self.assertIn('변경 이유(Why)', user_prompt)
        self.assertIn('세션 만료 문제를 해결하려는 배경', user_prompt)
        self.assertIn(
            '로그인 API 추가가 실제 diff에서 확인되었습니다.', user_prompt
        )
        self.assertIn('reason에 없는 성과·실패 원인·형식 문제를', system_prompt)

    @patch.object(llm_client.litellm, 'completion_cost', return_value=0.001)
    @patch.object(llm_client.litellm, 'cost_per_token', return_value=(0.001, 0.001))
    @patch.object(llm_client.litellm, 'token_counter', return_value=10)
    @patch.object(llm_client.litellm, 'completion')
    def test_forced_tool_call_uses_pydantic_schema_and_extracts_arguments(
        self, completion, _token_counter, _cost_per_token, _completion_cost
    ):
        arguments = '{"issue_type":"skip","issue_type_reason":"질문 이슈입니다."}'
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

        raw, actual_model, actual_cost = llm_client._call_llm(
            'system',
            'user',
            0.0,
            output_model=llm_client.IssueScoreResponse,
            tool_name='submit_issue_score',
        )

        self.assertEqual(raw, arguments)
        self.assertEqual(actual_model, llm_client.LLM_FALLBACK_MODEL)
        self.assertEqual(actual_cost, 0.001)
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
                'issue_type_reason': '질문 이슈입니다.',
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
            llm_client.PrConsistencyResult,
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
            '```json\n{"issue_type":"skip","issue_type_reason":"질문입니다."}\n```',
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
