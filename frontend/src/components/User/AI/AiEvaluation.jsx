import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BsStar, BsChatLeftDots, BsArrowRightShort, BsGithub, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import ReactMarkdown from 'react-markdown';
import axiosInstance from '../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../utils/auth';
import '../User.css';
import './Ai.css';

function AiEvaluation() {
  const { username } = useParams();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [errorOccur, setErrorOccur] = useState(false);

  useEffect(() => {
    const getRepoList = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/user/api/guideline/' + username + '/', getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setRepos(res.data.guideline);
        } else {
          setErrorOccur(true);
        }
      } catch (error) {
        console.error('Failed to fetch repo list:', error);
        setErrorOccur(true);
      } finally {
        setLoading(false);
      }
    };
    getRepoList();
  }, [username]);

  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [noReadme, setNoReadme] = useState(false);
  const [repoListOpen, setRepoListOpen] = useState(true);
  const [evaluationError, setEvaluationError] = useState(null);

  const fetchAiEvaluation = async (githubUsername, repoName) => {
    try {
      const response = await axiosInstance.get(
        `/v2/ai-evaluation/readme?githubUsername=${githubUsername}&repoName=${repoName}`,
        getAuthConfig()
      );
      if (response.data.status === 'success' && response.data.data) {
        setEvaluationData(response.data.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to fetch AI evaluation:', error);
      return false;
    }
  };

  const evaluateReadme = async (githubUsername, repoName) => {
    setEvaluationLoading(true);
    setEvaluationError(null);
    try {
      const response = await axiosInstance.post(
        '/v2/ai-evaluation/readme',
        { githubUsername, repoName },
        { ...getAuthConfig(), timeout: 115000 }
      );
      if (response.data.status === 'success') {
        setEvaluationData(response.data.data);
      } else {
        const msg = response.data.message || '';
        if (msg.includes('README가 없는')) {
          setNoReadme(true);
        } else {
          setEvaluationError(msg);
        }
      }
    } catch (error) {
      console.error('AI Evaluation failed:', error);
      const serverMessage = error.response?.data?.message || '';
      if (serverMessage.includes('README가 없는')) {
        setNoReadme(true);
      } else {
        setEvaluationError(serverMessage || 'AI 평가 요청에 실패했습니다.');
      }
    } finally {
      setEvaluationLoading(false);
    }
  };

  const handleRepoClick = async (repo) => {
    setSelectedRepo(repo);
    setEvaluationData(null);
    setReadmeOpen(false);
    setNoReadme(false);
    setEvaluationError(null);

    const githubUsername = repo.github_id || repo.owner_id;
    const hasData = await fetchAiEvaluation(githubUsername, repo.repo_name);
    if (!hasData) {
      evaluateReadme(githubUsername, repo.repo_name);
    }
  };

  if (loading)
    return (
      <div className="text-center" style={{ marginTop: '100px' }}>
        <LoaderIcon />
      </div>
    );
  if (errorOccur) return <div className="text-center mt-5">데이터를 불러오는 중 오류가 발생했습니다.</div>;

  return (
    <div className="container ai-eval-container">
      <div className="community-nav d-flex ai-eval-nav">
        <div className="nav nav-fill">
          <li className="nav-item selected-nav-item">
            <div>README 평가</div>
          </li>
        </div>
      </div>

      <div className="ai-eval-description">
        ✦ AI 모델을 활용해 레포지토리 README의 품질과 수준을 분석하고, 구체적인 개선점을 제안합니다.
      </div>

      <div className="row">
        {/* 왼쪽: 레포지토리 목록 */}
        <div className={repoListOpen ? 'col-md-5' : 'col-md-2'}>
          <button
            className="repo-section-title-btn"
            onClick={() => setRepoListOpen((prev) => !prev)}
          >
            <span>Repositories</span>
            {repoListOpen ? <BsChevronLeft size={14} /> : <BsChevronRight size={14} />}
          </button>
          <div className={`repo-list-scroll-container${repoListOpen ? '' : ' d-none'}`}>
            {repos.length > 0 ? (
              repos.map((repo, index) => (
                <div
                  className={`card mb-3 shadow-sm repo-card ${selectedRepo?.repo_name === repo.repo_name ? 'selected' : ''}`}
                  key={index}
                  onClick={() => handleRepoClick(repo)}
                >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="repo-card-title">{repo.repo_name}</h6>
                        <small className="text-muted d-block mb-2">Created by {repo.owner_id}</small>
                      </div>
                      <span className="badge badge-light" style={{ fontSize: '0.85rem' }}>
                        <BsStar className="mr-1" /> {repo.star_count}
                      </span>
                    </div>
                    <p className="text-muted mb-2 repo-description">{repo.proj_short_desc || '설명이 없습니다.'}</p>
                    <div className="text-right">
                      <small className="text-muted last-commit-text">
                        Last Commit: {repo.committer_date ? repo.committer_date.split('T')[0] : 'N/A'}
                      </small>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted ml-2">분석 가능한 리포지토리가 없습니다.</div>
            )}
          </div>
        </div>

        {/* 오른쪽: AI 피드백 결과 */}
        <div className={repoListOpen ? 'col-md-7' : 'col-md-10'}>
          {selectedRepo ? (
            <div className="card shadow-sm ai-result-card">
              <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <a
                  href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-weight-bold ai-result-header-link"
                >
                  <BsGithub className="ai-repo-icon text-dark" />
                  <span className="ai-repo-name">{selectedRepo.repo_name}</span>
                </a>

                <button
                  className="btn btn-sm btn-primary px-3 shadow-sm"
                  onClick={() =>
                    evaluateReadme(selectedRepo.github_id || selectedRepo.owner_id, selectedRepo.repo_name)
                  }
                  disabled={evaluationLoading}
                >
                  {evaluationLoading ? '평가 중...' : 'AI 재평가'}
                </button>
              </div>
              <div className="card-body ai-result-body">
                {evaluationData?.readme && (
                  <div className="readme-section mb-3">
                    <button
                      className="btn btn-sm btn-outline-secondary w-100 text-left d-flex justify-content-between align-items-center"
                      onClick={() => setReadmeOpen((prev) => !prev)}
                    >
                      <span>README 원문 보기</span>
                      <span>{readmeOpen ? '▲' : '▼'}</span>
                    </button>
                    {readmeOpen && (
                      <div className="readme-content mt-2 p-3 bg-light border rounded">
                        <ReactMarkdown>{evaluationData.readme}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                <h6 className="ai-analysis-title">
                  <BsChatLeftDots className="mr-2 text-info" /> AI 평가 결과
                </h6>

                {evaluationError && (
                  <div className="alert alert-warning mt-3" role="alert">
                    ⚠️ {evaluationError}
                  </div>
                )}

                {evaluationLoading ? (
                  <div className="text-center py-5 mt-4">
                    <LoaderIcon />
                    <p className="mt-3 text-muted">AI가 분석 중입니다...</p>
                    <p className="text-muted small">README 길이에 따라 최대 2분까지 소요될 수 있습니다.</p>
                  </div>
                ) : evaluationData ? (
                  <div className="mt-4">
                    {evaluationData.score && (
                      <div className="mb-4 p-3 bg-light rounded score-container">
                        <div className="d-flex align-items-center mb-3">
                          <div className={`score-badge score-${evaluationData.score === 'A+' ? 'Aplus' : evaluationData.score.charAt(0).toUpperCase()}`}>
                            {evaluationData.score}
                          </div>
                          <div className="ml-3">
                            <h6 className="mb-1 font-weight-bold">README Quality Score</h6>
                            <p className="mb-0 text-muted small">
                              {evaluationData.total_score != null
                                ? `${evaluationData.total_score} / 15점`
                                : 'AI가 분석한 문서화 완성도 등급입니다.'}
                            </p>
                          </div>
                        </div>
                        {evaluationData.criteria_scores && (
                          <div className="criteria-scores">
                            {(() => {
                              const reproScore =
                                (evaluationData.criteria_scores['reproducibility_code']?.score ?? 0) +
                                (evaluationData.criteria_scores['reproducibility_result']?.score ?? 0);
                              return [
                                { key: 'clarity',      label: '명확성', score: evaluationData.criteria_scores['clarity']?.score ?? 0,     max: 4 },
                                { key: 'readability',  label: '가독성', score: evaluationData.criteria_scores['readability']?.score ?? 0,  max: 4 },
                                { key: 'reproducibility', label: '재현성', score: reproScore, max: 4 },
                              ].map(({ key, label, score, max }) => (
                                <div key={key} className="criteria-row">
                                  <span className="criteria-label">{label}</span>
                                  <div className="criteria-bar-wrap">
                                    <div className="criteria-bar" style={{ width: `${(score / max) * 100}%` }} />
                                  </div>
                                  <span className="criteria-score">{score} / {max}</span>
                                </div>
                              ));
                            })()}
                            <div className="bonus-checklist">
                              {[
                                { key: 'visual',        label: '시각 자료' },
                                { key: 'license',       label: '라이선스' },
                                { key: 'collaboration', label: '협업' },
                              ].map(({ key, label }) => {
                                const passed = (evaluationData.criteria_scores[key]?.score ?? 0) === 1;
                                return (
                                  <span key={key} className={`bonus-item ${passed ? 'bonus-pass' : 'bonus-fail'}`}>
                                    {passed ? '✓' : '✗'} {label}{passed && <span className="bonus-point"> +1점</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="feedback-box strengths">
                      <h6 className="feedback-box-title text-success">Strengths (잘한 점)</h6>
                      <ul>
                        {evaluationData.strengths?.map((item, idx) => (
                          <li key={idx} className="mb-1">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="feedback-box improvements">
                      <h6 className="feedback-box-title text-warning">Improvements (보완할 점)</h6>
                      <ul>
                        {evaluationData.improvements?.map((item, idx) => (
                          <li key={idx} className="mb-1">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {evaluationData.missing_essentials &&
                      evaluationData.missing_essentials.filter((item) => item && String(item).trim() !== '').length >
                        0 && (
                        <div className="feedback-box missing-essentials mb-4">
                          <h6 className="feedback-box-title text-danger">Missing Essentials (누락된 항목)</h6>
                          <ul>
                            {evaluationData.missing_essentials
                              .filter((item) => item && String(item).trim() !== '')
                              .map((item, idx) => (
                                <li key={idx} className="mb-1 text-danger font-weight-bold">
                                  {item}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                    <div className="feedback-box advice">
                      <h6 className="feedback-box-title text-info">Advice (조언)</h6>
                      <ul>
                        {evaluationData.advice?.map((item, idx) => (
                          <li key={idx} className="mb-1">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="last-analysis-footer d-flex justify-content-between align-items-center">
                      <a
                        href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        README 수정하러 가기 →
                      </a>
                      <span className="text-muted small">
                        Last AI Analysis:{' '}
                        {evaluationData.updated_at ? new Date(evaluationData.updated_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : noReadme ? (
                  <div className="empty-data-box text-center text-muted border rounded mt-4">
                    <p className="mb-2">README 파일이 존재하지 않습니다.</p>
                    <a
                      href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      README 만들러 가기 →
                    </a>
                  </div>
                ) : (
                  <div className="empty-data-box text-center text-muted border rounded mt-4">
                    <p className="mb-0">
                      분석된 데이터가 없습니다. 상단의 'AI 재평가' 버튼을 눌러 분석을 시작하세요.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card shadow-sm empty-selection-card d-flex flex-column align-items-center justify-content-center text-muted">
              <BsArrowRightShort size={60} className="mb-3" style={{ opacity: 0.3 }} />
              <h5>Select a Repository</h5>
              <p className="text-center">
                왼쪽 목록에서 분석하고 싶은 리포지토리를 선택하면
                <br />
                AI가 README를 평가해 드립니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiEvaluation;
