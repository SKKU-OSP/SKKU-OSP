import { useCallback, useEffect, useState } from 'react';
import { BsArrowClockwise } from 'react-icons/bs';

import axiosInstance from '../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../utils/auth';

const TYPE_LABELS = {
  readme: 'README',
  pr: 'PR',
  issue: '이슈',
  commit: '커밋',
};

const STATUS_LABELS = {
  full: '완료',
  partial: '부분 완료',
  code_only: '코드 분석만 완료',
  skipped: '평가 제외',
  rejected: '평가 입력 없음',
  failed: '실패',
};

const ERROR_CATEGORY_LABELS = {
  missing_content: '평가 입력 없음',
  invalid_target: '잘못된 평가 대상',
  llm_credit: 'LLM 크레딧 부족',
  llm_auth: 'LLM 인증 오류',
  llm_rate_limit: 'LLM 호출 한도 초과',
  timeout: '응답 시간 초과',
  response_parse: 'LLM 응답 해석 실패',
  token_limit: '입력 크기 초과',
  dependency_unavailable: '외부 서비스 연결 실패',
  internal_error: '내부 오류',
};

const usd = (value, digits = 4) => `$${Number(value || 0).toFixed(digits)}`;

function targetLabel(target = {}) {
  const repository = [target.owner, target.repo].filter(Boolean).join('/');
  if (target.pr_number != null) return `${repository}#${target.pr_number}`;
  if (target.issue_number != null) return `${repository}#${target.issue_number}`;
  if (target.sha) return `${repository}@${String(target.sha).slice(0, 7)}`;
  return repository || '-';
}

function errorLabel(row) {
  if (!row.error_category) return '-';
  return ERROR_CATEGORY_LABELS[row.error_category] || row.error_category;
}

function AiUsageDashboard({ active }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUsage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(
        `/v2/ai-evaluation/usage?days=${days}`,
        getAuthConfig(),
      );
      setData(response.data?.data || null);
    } catch (requestError) {
      if (requestError?.response?.status === 403) {
        setError('관리자만 사용량을 확인할 수 있습니다.');
      } else {
        setError('AI 평가 사용량을 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (active) loadUsage();
  }, [active, loadUsage]);

  if (loading && !data) {
    return <div className="ai-usage-state">사용량을 불러오고 있습니다.</div>;
  }
  if (error && !data) {
    return <div className="alert alert-warning mb-0">{error}</div>;
  }

  const summary = data?.summary || {};
  const recentDaily = [...(data?.daily || [])].reverse().slice(0, 14);
  const latestDay = data?.period?.to;
  const latestUsers = (data?.daily_by_user || [])
    .filter((row) => row.day === latestDay)
    .slice(0, 20);

  return (
    <div className="ai-usage-dashboard">
      <div className="ai-usage-toolbar">
        <div>
          <h4 className="mb-1">AI 평가 사용량</h4>
          <p className="text-muted mb-0">실제 LLM 호출 비용을 기준으로 집계합니다.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm ai-usage-period"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            aria-label="조회 기간"
          >
            <option value={7}>최근 7일</option>
            <option value={30}>최근 30일</option>
            <option value={90}>최근 90일</option>
          </select>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={loadUsage}
            disabled={loading}
          >
            <BsArrowClockwise className={loading ? 'ai-usage-spin' : ''} /> 새로고침
          </button>
        </div>
      </div>

      {error && <div className="alert alert-warning py-2">{error}</div>}

      <div className="ai-usage-summary-grid">
        <div className="ai-usage-metric">
          <span>기간 총비용</span>
          <strong>{usd(summary.total_cost, 4)}</strong>
        </div>
        <div className="ai-usage-metric">
          <span>평가 횟수</span>
          <strong>{Number(summary.evaluation_count || 0).toLocaleString()}회</strong>
        </div>
        <div className="ai-usage-metric">
          <span>순 사용자</span>
          <strong>{Number(summary.unique_users || 0).toLocaleString()}명</strong>
        </div>
        <div className="ai-usage-metric">
          <span>평균 비용</span>
          <strong>{usd(
            summary.evaluation_count
              ? summary.total_cost / summary.evaluation_count
              : 0,
            4,
          )}</strong>
        </div>
        <div className="ai-usage-metric">
          <span>실패</span>
          <strong>{Number(summary.failed_count || 0).toLocaleString()}건</strong>
        </div>
      </div>

      <div className="ai-usage-section">
        <h5>실패·부분 실패 원인</h5>
        <div className="table-responsive">
          <table className="table table-sm ai-usage-table mb-0">
            <thead>
              <tr><th>원인</th><th>상태</th><th>건수</th><th>발생 비용</th></tr>
            </thead>
            <tbody>
              {(data?.failure_categories || []).length ? data.failure_categories.map((row) => (
                <tr key={`${row.error_category}-${row.status}`}>
                  <td className="font-weight-bold">{ERROR_CATEGORY_LABELS[row.error_category] || row.error_category}</td>
                  <td>{STATUS_LABELS[row.status] || row.status}</td>
                  <td>{row.count}</td>
                  <td>{usd(row.total_cost, 6)}</td>
                </tr>
              )) : <tr><td colSpan="4" className="text-muted text-center">기록된 실패가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ai-usage-section">
        <h5>평가 유형별 비용 분포</h5>
        <div className="table-responsive">
          <table className="table table-sm ai-usage-table mb-0">
            <thead>
              <tr><th>유형</th><th>표본</th><th>Median</th><th>P90</th><th>P99</th><th>최대</th></tr>
            </thead>
            <tbody>
              {Object.keys(TYPE_LABELS).map((type) => {
                const distribution = data?.cost_distribution?.[type] || {};
                return (
                  <tr key={type}>
                    <td className="font-weight-bold">{TYPE_LABELS[type]}</td>
                    <td>{distribution.count || 0}</td>
                    <td>{usd(distribution.median, 5)}</td>
                    <td>{usd(distribution.p90, 5)}</td>
                    <td>{usd(distribution.p99, 5)}</td>
                    <td>{usd(distribution.max, 5)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-3">
          <div className="ai-usage-section h-100">
            <h5>일별 사용량</h5>
            <div className="table-responsive ai-usage-table-scroll">
              <table className="table table-sm ai-usage-table mb-0">
                <thead><tr><th>날짜</th><th>비용</th><th>횟수</th><th>사용자</th></tr></thead>
                <tbody>
                  {recentDaily.length ? recentDaily.map((row) => (
                    <tr key={row.day}>
                      <td>{row.day}</td>
                      <td>{usd(row.total_cost, 5)}</td>
                      <td>{row.evaluation_count}</td>
                      <td>{row.unique_users}</td>
                    </tr>
                  )) : <tr><td colSpan="4" className="text-muted text-center">기록이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-6 mb-3">
          <div className="ai-usage-section h-100">
            <h5>오늘 사용자별 사용량</h5>
            <div className="table-responsive ai-usage-table-scroll">
              <table className="table table-sm ai-usage-table mb-0">
                <thead><tr><th>사용자</th><th>비용</th><th>횟수</th></tr></thead>
                <tbody>
                  {latestUsers.length ? latestUsers.map((row) => (
                    <tr key={`${row.day}-${row.github_id}`}>
                      <td>{row.github_id}</td>
                      <td>{usd(row.total_cost, 5)}</td>
                      <td>{row.evaluation_count}</td>
                    </tr>
                  )) : <tr><td colSpan="3" className="text-muted text-center">오늘 기록이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="ai-usage-section">
        <h5>최근 평가 기록</h5>
        <div className="table-responsive ai-usage-table-scroll ai-usage-recent-scroll">
          <table className="table table-sm ai-usage-table mb-0">
            <thead>
              <tr><th>실행 시각</th><th>사용자</th><th>유형</th><th>대상</th><th>상태</th><th>실패 단계</th><th>원인</th><th>비용</th><th>실제 모델</th></tr>
            </thead>
            <tbody>
              {(data?.recent || []).length ? data.recent.map((row) => (
                <tr key={row.id}>
                  <td className="text-nowrap">{new Date(row.created_at).toLocaleString('ko-KR')}</td>
                  <td>{row.github_id}</td>
                  <td>{TYPE_LABELS[row.eval_type] || row.eval_type}</td>
                  <td>{targetLabel(row.target)}</td>
                  <td><span className={`ai-usage-status status-${row.status}`}>{STATUS_LABELS[row.status] || row.status}</span></td>
                  <td>{row.error_stage || '-'}</td>
                  <td className="ai-usage-error" title={row.error_message || ''}>
                    {errorLabel(row)}{row.error_code ? ` (${row.error_code})` : ''}
                  </td>
                  <td>{usd(row.actual_cost, 6)}</td>
                  <td className="ai-usage-model">{row.model_name || '-'}</td>
                </tr>
              )) : <tr><td colSpan="9" className="text-muted text-center">기록이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AiUsageDashboard;
