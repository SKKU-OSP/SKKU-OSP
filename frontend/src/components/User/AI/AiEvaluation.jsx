import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BsStar, BsChatLeftDots, BsArrowRightShort, BsGithub, BsChevronLeft, BsChevronRight, BsGit, BsFileEarmarkText, BsExclamationCircle, BsCodeSlash } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import axiosInstance from '../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../utils/auth';
import '../User.css';
import './Ai.css';

const mdImgComponents = {
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt || ''}
      {...props}
      style={{ maxWidth: '100%', borderRadius: '4px', margin: '0.5rem 0', display: 'block' }}
      onError={(e) => {
        e.target.replaceWith(Object.assign(document.createElement('span'), {
          className: 'text-muted small',
          textContent: `[이미지를 불러올 수 없습니다: ${alt || src}]`,
        }));
      }}
    />
  ),
};

// ── 레이더 차트 ─────────────────────────────────────────────────────────

function RadarChart({ axes, size = 240 }) {
  const [hovered, setHovered] = useState(null);
  const n = axes.length;
  if (n < 3) return null;
  const cx = size / 2;
  const cy = size / 2;
  const r = cx * 0.60;
  const labelR = cx * 0.82;
  const angle = (i) => (2 * Math.PI * i) / n - Math.PI / 2;
  const ptX = (i, rad) => cx + rad * Math.cos(angle(i));
  const ptY = (i, rad) => cy + rad * Math.sin(angle(i));
  const gridPts = (lv) => axes.map((_, i) => `${ptX(i, r * lv)},${ptY(i, r * lv)}`).join(' ');
  const norms = axes.map((ax) => (ax.max > 0 ? Math.min(ax.value / ax.max, 1) : 0));
  const dataPts = axes.map((_, i) => `${ptX(i, r * norms[i])},${ptY(i, r * norms[i])}`).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }} role="img" aria-label="점수 레이더 차트">
      {[0.25, 0.5, 0.75, 1].map((lv) => (
        <polygon key={lv} points={gridPts(lv)} fill="none" stroke="#dee2e6" strokeWidth={lv === 1 ? 1.5 : 1} />
      ))}
      {axes.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={ptX(i, r)} y2={ptY(i, r)} stroke="#dee2e6" strokeWidth="1" />
      ))}
      <polygon points={dataPts} fill="rgba(0,123,255,0.18)" stroke="#007bff" strokeWidth="2" strokeLinejoin="round" />
      {axes.map((_, i) => (
        <circle key={i} cx={ptX(i, r * norms[i])} cy={ptY(i, r * norms[i])} r={5}
          fill={hovered === i ? '#0056b3' : '#007bff'} stroke="white" strokeWidth="1.5"
          style={{ cursor: 'default' }}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
      ))}
      {axes.map((ax, i) => (
        <text key={i} x={ptX(i, labelR)} y={ptY(i, labelR)}
          textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="600"
          fill={hovered === i ? '#007bff' : '#555'}>
          {ax.label}
        </text>
      ))}
      {hovered !== null && (() => {
        const ax = axes[hovered];
        const x = ptX(hovered, r * norms[hovered]);
        const y = ptY(hovered, r * norms[hovered]);
        const txt = `${ax.value} / ${ax.max}`;
        const bw = txt.length * 6 + 12;
        const bh = 18;
        const bx = Math.min(Math.max(x - bw / 2, 0), size - bw);
        const by = y < cy ? y + 10 : y - bh - 8;
        return (
          <g pointerEvents="none">
            <rect x={bx} y={by} width={bw} height={bh} rx={4} fill="#212529" opacity={0.88} />
            <text x={bx + bw / 2} y={by + bh / 2} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="white" fontWeight="600">{txt}</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ── README 탭 ────────────────────────────────────────────────────

function ReadmeTab({ repos, loading, errorOccur }) {
  const [selectedRepo, setSelectedRepo] = useState(null);
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
    } catch {
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
        if (msg.includes('README가 없는')) setNoReadme(true);
        else setEvaluationError(msg);
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || '';
      if (serverMessage.includes('README가 없는')) setNoReadme(true);
      else setEvaluationError(serverMessage || 'AI 평가 요청에 실패했습니다.');
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
    if (!hasData) evaluateReadme(githubUsername, repo.repo_name);
  };

  if (loading) return <div className="text-center" style={{ marginTop: '100px' }}><LoaderIcon /></div>;
  if (errorOccur) return <div className="text-center mt-5">데이터를 불러오는 중 오류가 발생했습니다.</div>;

  return (
    <div className="row">
      {/* 왼쪽: 레포 목록 */}
      <div className={repoListOpen ? 'col-md-5' : 'col-md-2'}>
        <button className="repo-section-title-btn" onClick={() => setRepoListOpen((p) => !p)}>
          <span>Repositories</span>
          {repoListOpen ? <BsChevronLeft size={14} /> : <BsChevronRight size={14} />}
        </button>
        <div className={`repo-list-scroll-container${repoListOpen ? '' : ' d-none'}`}>
          {repos.length > 0 ? repos.map((repo, i) => (
            <div
              key={i}
              className={`card mb-3 shadow-sm repo-card ${selectedRepo?.repo_name === repo.repo_name ? 'selected' : ''}`}
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
          )) : <div className="text-muted ml-2">분석 가능한 리포지토리가 없습니다.</div>}
        </div>
      </div>

      {/* 오른쪽: 결과 */}
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
                onClick={() => evaluateReadme(selectedRepo.github_id || selectedRepo.owner_id, selectedRepo.repo_name)}
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
                    onClick={() => setReadmeOpen((p) => !p)}
                  >
                    <span>README 원문 보기</span>
                    <span>{readmeOpen ? '▲' : '▼'}</span>
                  </button>
                  {readmeOpen && (
                    <div className="readme-content mt-2 p-3 bg-light border rounded">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdImgComponents}>{evaluationData.readme}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              <h6 className="ai-analysis-title"><BsChatLeftDots className="mr-2 text-info" /> AI 평가 결과</h6>

              {evaluationError && <div className="alert alert-warning mt-3" role="alert">⚠️ {evaluationError}</div>}

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
                            {evaluationData.total_score != null ? `${evaluationData.total_score} / 15점` : 'AI가 분석한 문서화 완성도 등급입니다.'}
                          </p>
                        </div>
                      </div>
                      {evaluationData.criteria_scores && (() => {
                        const reproScore =
                          (evaluationData.criteria_scores['reproducibility_code']?.score ?? 0) +
                          (evaluationData.criteria_scores['reproducibility_result']?.score ?? 0);
                        const bonusItems = [
                          { key: 'visual',        label: '시각 자료' },
                          { key: 'license',       label: '라이선스' },
                          { key: 'collaboration', label: '협업' },
                        ];
                        const bonusScore = bonusItems.reduce(
                          (sum, { key }) => sum + (evaluationData.criteria_scores[key]?.score ?? 0), 0
                        );
                        return (
                          <div className="d-flex" style={{ gap: '16px', alignItems: 'flex-start', borderTop: '1px solid #dee2e6', paddingTop: '0.75rem' }}>
                            <div className="criteria-scores" style={{ flex: 1, borderTop: 'none', paddingTop: 0 }}>
                              {[
                                { key: 'clarity',         label: '명확성', score: evaluationData.criteria_scores['clarity']?.score ?? 0,    max: 4 },
                                { key: 'readability',     label: '가독성', score: evaluationData.criteria_scores['readability']?.score ?? 0, max: 4 },
                                { key: 'reproducibility', label: '재현성', score: reproScore, max: 4 },
                                { key: 'bonus',           label: '보너스', score: bonusScore, max: 3 },
                              ].map(({ key, label, score, max }) => (
                                <div key={key} className="criteria-row">
                                  <span className="criteria-label">{label}</span>
                                  <div className="criteria-bar-wrap">
                                    <div className="criteria-bar" style={{ width: `${(score / max) * 100}%` }} />
                                  </div>
                                  <span className="criteria-score">{score} / {max}</span>
                                </div>
                              ))}
                              <div className="bonus-checklist">
                                {bonusItems.map(({ key, label }) => {
                                  const passed = (evaluationData.criteria_scores[key]?.score ?? 0) === 1;
                                  return (
                                    <span key={key} className={`bonus-item ${passed ? 'bonus-pass' : 'bonus-fail'}`}>
                                      {passed ? '✓' : '✗'} {label}{passed && <span className="bonus-point"> +1점</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div style={{ flexShrink: 0, marginTop: '-8px' }}>
                              <RadarChart axes={[
                                { label: '명확성', value: evaluationData.criteria_scores['clarity']?.score ?? 0, max: 4 },
                                { label: '가독성', value: evaluationData.criteria_scores['readability']?.score ?? 0, max: 4 },
                                { label: '재현성', value: reproScore, max: 4 },
                                { label: '보너스', value: bonusScore, max: 3 },
                              ]} size={170} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="feedback-box strengths">
                    <h6 className="feedback-box-title text-success">Strengths (잘한 점)</h6>
                    <ul>{evaluationData.strengths?.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                  </div>
                  <div className="feedback-box improvements">
                    <h6 className="feedback-box-title text-warning">Improvements (보완할 점)</h6>
                    <ul>{evaluationData.improvements?.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                  </div>
                  {evaluationData.missing_essentials?.filter((i) => i && String(i).trim() !== '').length > 0 && (
                    <div className="feedback-box missing-essentials mb-4">
                      <h6 className="feedback-box-title text-danger">Missing Essentials (누락된 항목)</h6>
                      <ul>
                        {evaluationData.missing_essentials
                          .filter((i) => i && String(i).trim() !== '')
                          .map((item, idx) => <li key={idx} className="mb-1 text-danger font-weight-bold">{item}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="feedback-box advice">
                    <h6 className="feedback-box-title text-info">Advice (조언)</h6>
                    <ul>{evaluationData.advice?.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                  </div>
                  <div className="last-analysis-footer d-flex justify-content-between align-items-center">
                    <a
                      href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >README 수정하러 가기 →</a>
                    <span className="text-muted small">
                      Last AI Analysis: {evaluationData.updated_at ? new Date(evaluationData.updated_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : noReadme ? (
                <div className="empty-data-box text-center text-muted border rounded mt-4">
                  <p className="mb-2">README 파일이 존재하지 않습니다.</p>
                  <a href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                    README 만들러 가기 →
                  </a>
                </div>
              ) : (
                <div className="empty-data-box text-center text-muted border rounded mt-4">
                  <p className="mb-0">분석된 데이터가 없습니다. 상단의 AI 재평가 버튼을 눌러 분석을 시작하세요.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card shadow-sm empty-selection-card d-flex flex-column align-items-center justify-content-center text-muted">
            <BsArrowRightShort size={60} className="mb-3" style={{ opacity: 0.3 }} />
            <h5>Select a Repository</h5>
            <p className="text-center">왼쪽 목록에서 분석하고 싶은 리포지토리를 선택하면<br />AI가 README를 평가해 드립니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PR 탭 ────────────────────────────────────────────────────────

function PrTab({ repos, loading, errorOccur }) {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoListOpen, setRepoListOpen] = useState(true);
  const [prCounts, setPrCounts] = useState({});

  useEffect(() => {
    if (!repos.length) return;
    const reposParam = repos
      .map((r) => `${r.github_id || r.owner_id}/${r.repo_name}`)
      .join(',');
    axiosInstance
      .get(`/v2/ai-evaluation/pr-counts?repos=${encodeURIComponent(reposParam)}`, getAuthConfig())
      .then((res) => {
        if (res.data.status === 'success') setPrCounts(res.data.data);
      })
      .catch((e) => console.error('PR 카운트 조회 실패:', e));
  }, [repos]);

  const [prList, setPrList] = useState([]);
  const [prListLoading, setPrListLoading] = useState(false);

  const [selectedPr, setSelectedPr] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalPhase, setEvalPhase] = useState(null);
  const [evalData, setEvalData] = useState(null);
  const [evalError, setEvalError] = useState(null);
  const [prBodyOpen, setPrBodyOpen] = useState(false);
  const [agentDetailsOpen, setAgentDetailsOpen] = useState(false);
  const [cohesionAgentDetailsOpen, setCohesionAgentDetailsOpen] = useState(false);
  const [prBody, setPrBody] = useState(null);

  const fetchPrList = async (repo) => {
    setPrListLoading(true);
    setPrList([]);
    setSelectedPr(null);
    setEvalData(null);
    setPrBody(null);
    try {
      const githubUsername = repo.github_id || repo.owner_id;
      const res = await axiosInstance.get(
        `/v2/ai-evaluation/pr-list?githubUsername=${githubUsername}&repoName=${repo.repo_name}`,
        getAuthConfig()
      );
      if (res.data.status === 'success') setPrList(res.data.data || []);
    } catch (e) {
      console.error('PR 목록 조회 실패:', e);
    } finally {
      setPrListLoading(false);
    }
  };

  const handleRepoClick = (repo) => {
    setSelectedRepo(repo);
    setEvalData(null);
    setEvalError(null);
    fetchPrList(repo);
  };

  const fetchExistingEval = async (pr) => {
    const githubUsername = selectedRepo.github_id || selectedRepo.owner_id;
    try {
      const res = await axiosInstance.get(
        `/v2/ai-evaluation/pr?githubUsername=${githubUsername}&repoName=${selectedRepo.repo_name}&prNumber=${pr.pr_number}`,
        getAuthConfig()
      );
      if (res.data.status === 'success' && res.data.data) {
        const data = res.data.data;
        setPrBody(data.pr_body || null);
        if (data.evaluated) {
          setEvalData(data);
          return true;
        }
      }
    } catch {
      setPrBody(null);
    }
    return false;
  };

  const evaluatePr = async (pr) => {
    const githubUsername = selectedRepo.github_id || selectedRepo.owner_id;
    const progressId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID().replaceAll('-', '')
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let progressTimer = null;
    setEvalLoading(true);
    setEvalPhase('text_evaluation');
    setEvalError(null);
    setAgentDetailsOpen(false);
    setCohesionAgentDetailsOpen(false);
    try {
      progressTimer = window.setInterval(async () => {
        try {
          const progressRes = await axiosInstance.get(
            `/v2/ai-evaluation/pr-progress?progressId=${encodeURIComponent(progressId)}`,
            getAuthConfig()
          );
          const phase = progressRes.data?.data?.phase;
          if (phase && phase !== 'unknown') setEvalPhase(phase);
        } catch {
          // 진행 상태 조회 실패가 실제 평가 요청을 방해하지 않도록 무시한다.
        }
      }, 2000);
      const res = await axiosInstance.post(
        '/v2/ai-evaluation/pr',
        {
          githubUsername,
          repoName: selectedRepo.repo_name,
          prNumber: pr.pr_number,
          progressId,
        },
        { ...getAuthConfig(), timeout: 240000 }
      );
      if (res.data.status === 'success') setEvalData(res.data.data);
      else setEvalError(res.data.message || 'AI 평가에 실패했습니다.');
    } catch (error) {
      setEvalError(error.response?.data?.message || 'AI 평가 요청에 실패했습니다.');
    } finally {
      if (progressTimer) window.clearInterval(progressTimer);
      setEvalPhase(null);
      setEvalLoading(false);
    }
  };

  const handlePrClick = async (pr) => {
    setSelectedPr(pr);
    setEvalData(null);
    setEvalError(null);
    setPrBodyOpen(false);
    setAgentDetailsOpen(false);
    setCohesionAgentDetailsOpen(false);
    setPrBody(undefined);
    await fetchExistingEval(pr);
  };

  const gradeClass = (score) => {
    if (!score) return '';
    if (score === 'A+') return 'score-Aplus';
    return `score-${score.charAt(0).toUpperCase()}`;
  };

  if (loading) return <div className="text-center" style={{ marginTop: '100px' }}><LoaderIcon /></div>;
  if (errorOccur) return <div className="text-center mt-5">데이터를 불러오는 중 오류가 발생했습니다.</div>;

  return (
    <div className="row">
      {/* 레포 목록 */}
      <div className={repoListOpen ? 'col-md-3' : 'col-md-1'}>
        <button className="repo-section-title-btn" onClick={() => setRepoListOpen((p) => !p)}>
          <span>Repos</span>
          {repoListOpen ? <BsChevronLeft size={14} /> : <BsChevronRight size={14} />}
        </button>
        <div className={`repo-list-scroll-container${repoListOpen ? '' : ' d-none'}`}>
          {repos.length > 0 ? repos.map((repo, i) => (
            <div
              key={i}
              className={`card mb-2 shadow-sm repo-card ${selectedRepo?.repo_name === repo.repo_name ? 'selected' : ''}`}
              onClick={() => handleRepoClick(repo)}
            >
              <div className="card-body p-2">
                <h6 className="repo-card-title mb-1" style={{ fontSize: '0.85rem' }}>{repo.repo_name}</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>{repo.owner_id}</small>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>PR {prCounts[repo.repo_name] ?? 0}개</small>
                </div>
              </div>
            </div>
          )) : <div className="text-muted ml-2" style={{ fontSize: '0.85rem' }}>리포지토리가 없습니다.</div>}
        </div>
      </div>

      {/* PR 목록 */}
      <div className="col-md-3">
        <div className="repo-section-title-btn" style={{ cursor: 'default' }}>
          <span>Pull Requests</span>
          {selectedRepo && <small className="text-muted ml-1" style={{ fontSize: '0.75rem' }}>{prList.length}개</small>}
        </div>
        <div className="repo-list-scroll-container">
          {!selectedRepo ? (
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>레포지토리를 선택하세요.</div>
          ) : prListLoading ? (
            <div className="text-center mt-3"><LoaderIcon /></div>
          ) : prList.length > 0 ? prList.map((pr, i) => (
            <div
              key={i}
              className={`card mb-2 shadow-sm repo-card ${selectedPr?.pr_number === pr.pr_number ? 'selected' : ''}`}
              onClick={() => handlePrClick(pr)}
            >
              <div className="card-body p-2">
                <div className="d-flex align-items-start gap-1">
                  <BsGit className="text-success mt-1 flex-shrink-0" size={13} />
                  <div style={{ minWidth: 0 }}>
                    <p className="mb-0 pr-title-text">{pr.title}</p>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      #{pr.pr_number} · {pr.author} · {pr.date ? pr.date.split('T')[0] : ''}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>PR이 없습니다.</div>
          )}
        </div>
      </div>

      {/* 평가 결과 */}
      <div className={repoListOpen ? 'col-md-6' : 'col-md-8'}>
        {selectedPr ? (
          <div className="card shadow-sm ai-result-card">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div>
                <a
                  href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}/pull/${selectedPr.pr_number}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-weight-bold ai-result-header-link"
                  style={{ fontSize: '1rem' }}
                >
                  <BsGit className="text-success flex-shrink-0" style={{ marginRight: '8px' }} />
                  <span>#{selectedPr.pr_number} {selectedPr.title}</span>
                </a>
                <small className="text-muted d-block mt-1">{selectedPr.author} · {selectedPr.date ? selectedPr.date.split('T')[0] : ''}</small>
              </div>
              <button
                className="btn btn-sm btn-primary px-3 shadow-sm flex-shrink-0"
                onClick={() => evaluatePr(selectedPr)}
                disabled={evalLoading || !evalData}
                title={!evalData ? '먼저 AI 평가를 실행해 주세요.' : ''}
              >
                {evalLoading ? '평가 중...' : 'AI 재평가'}
              </button>
            </div>
            <div className="card-body ai-result-body">
              {prBody !== undefined && (
                prBody
                  ? (
                    <div className="readme-section mb-3">
                      <button
                        className="btn btn-sm btn-outline-secondary w-100 text-left d-flex justify-content-between align-items-center"
                        onClick={() => setPrBodyOpen((p) => !p)}
                      >
                        <span>PR 본문 보기</span>
                        <span>{prBodyOpen ? '▲' : '▼'}</span>
                      </button>
                      {prBodyOpen && (
                        <div className="readme-content mt-2 p-3 bg-light border rounded">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdImgComponents}>{prBody}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )
                  : <p className="text-muted small mb-3">PR 본문이 없습니다.</p>
              )}

              <h6 className="ai-analysis-title"><BsChatLeftDots className="mr-2 text-info" /> AI 평가 결과</h6>

              {evalError && <div className="alert alert-warning mt-3" role="alert">⚠️ {evalError}</div>}

              {evalLoading ? (
                <div className="text-center py-5 mt-4">
                  <LoaderIcon />
                  <p className="mt-3 mb-2 font-weight-bold">PR 평가를 진행하고 있습니다</p>
                  {evalPhase === 'consistency_agent' && (
                    <p className="pr-agent-loading-status">
                      <span /> 정합성 검증 에이전트가 커밋을 확인하고 있습니다.<br />
                      코드 변경량에 따라 시간이 오래 소요될 수 있습니다.
                    </p>
                  )}
                  {evalPhase === 'cohesion_agent' && (
                    <p className="pr-agent-loading-status">
                      <span /> 응집성 검증 에이전트가 커밋들의 관련성을 확인하고 있습니다.<br />
                      애매한 커밋의 코드 변경량에 따라 시간이 오래 소요될 수 있습니다.
                    </p>
                  )}
                </div>
              ) : evalData ? (
                <div className="mt-3">
                  {evalData.pr_score && (
                    <div className="mb-4 p-3 bg-light rounded score-container">
                      <div className="d-flex align-items-center mb-2">
                        <div className={`score-badge ${gradeClass(evalData.pr_score)}`}>
                          {evalData.pr_score}
                        </div>
                        <div className="ml-3">
                          <h6 className="mb-1 font-weight-bold">PR Quality Score</h6>
                          <p className="mb-0 text-muted small">
                            {evalData.pr_total_score != null
                              ? `${evalData.pr_total_score} / ${evalData.pr_breakdown?.max_score ?? 6}점`
                              : '충실도 (0~3) + 명료성 (0~1) + 보너스 (0~2) + 변경 정합성 (0~2) + 응집성 (0~1)'}
                          </p>
                        </div>
                      </div>
                      {evalData.pr_breakdown && (
                        <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '0.75rem' }}>
                          <div className="d-flex" style={{ gap: '16px', alignItems: 'flex-start' }}>
                            <div className="criteria-scores" style={{ flex: 1, minWidth: 0, borderTop: 'none', paddingTop: 0 }}>
                            {[
                              { label: '설명 충실도', score: evalData.pr_breakdown.fulfilment ?? 0, max: 3 },
                              { label: '목적 명료성', score: evalData.pr_breakdown.clarity ?? 0, max: 1 },
                              {
                                label: '변경 정합성',
                                score: evalData.pr_breakdown.consistency,
                                max: 2,
                              },
                              {
                                label: 'PR 응집성',
                                score: evalData.pr_breakdown.cohesion,
                                max: 1,
                              },
                              { label: '보너스',     score: evalData.pr_breakdown.bonus ?? 0,      max: 2 },
                            ].map(({ label, score, max }) => (
                              <div key={label} className="criteria-row">
                                <span className="criteria-label">{label}</span>
                                <div className="criteria-bar-wrap">
                                  <div className="criteria-bar" style={{ width: `${score == null ? 0 : (score / max) * 100}%` }} />
                                </div>
                                <span className="criteria-score">{score == null ? 'N/A' : score} / {max}</span>
                              </div>
                            ))}
                            <div className="bonus-checklist">
                              {['이슈 연결', '커밋 컨벤션', '리뷰 보조자료'].map((item) => {
                                const passed = evalData.pr_breakdown.bonus_earned?.includes(item);
                                return (
                                  <span key={item} className={`bonus-item ${passed ? 'bonus-pass' : 'bonus-fail'}`}>
                                    {passed ? '✓' : '✗'} {item}
                                    {passed && <span className="bonus-point"> +{item === '이슈 연결' ? '1' : '0.5'}점</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                            <div style={{ flexShrink: 0, marginTop: '-8px' }}>
                              <RadarChart axes={[
                                { label: '충실도', value: evalData.pr_breakdown.fulfilment ?? 0, max: 3 },
                                { label: '명료성', value: evalData.pr_breakdown.clarity ?? 0, max: 1 },
                                { label: '정합성', value: evalData.pr_breakdown.consistency ?? 0, max: 2 },
                                { label: '응집성', value: evalData.pr_breakdown.cohesion ?? 0, max: 1 },
                                { label: '보너스', value: evalData.pr_breakdown.bonus ?? 0, max: 2 },
                              ]} size={130} />
                            </div>
                          </div>
                          {evalData.pr_breakdown.consistency_reason && (
                            <div className="pr-consistency-result mt-3">
                              <div className="pr-consistency-result-title">변경 정합성 평가 결과</div>
                              {(() => {
                                const status = evalData.pr_breakdown.consistency_status;
                                const statusMeta = {
                                  matched: { icon: '✓', label: '설명과 실제 변경이 일치합니다', className: 'matched' },
                                  partially_matched: { icon: '△', label: '설명과 실제 변경이 일부 일치합니다', className: 'partial' },
                                  mismatched: { icon: '!', label: '설명과 실제 변경이 일치하지 않습니다', className: 'mismatched' },
                                  'N/A': { icon: '−', label: '변경 정합성을 평가하지 않았습니다', className: 'na' },
                                }[status];
                                return statusMeta ? (
                                  <div className={`pr-consistency-verdict ${statusMeta.className}`}>
                                    {statusMeta.icon} {statusMeta.label}
                                  </div>
                                ) : null;
                              })()}
                              <div className="pr-consistency-result-text">
                                {evalData.pr_breakdown.consistency_reason}
                              </div>
                              {Array.isArray(evalData.pr_breakdown.consistency_evidence)
                                && evalData.pr_breakdown.consistency_evidence.length > 0 && (
                                <div className="pr-consistency-evidence">
                                  <div className="pr-consistency-evidence-title">확인한 주요 변경</div>
                                  <ul>
                                    {evalData.pr_breakdown.consistency_evidence.map((item, index) => (
                                      <li key={`${index}-${item}`}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          {Array.isArray(evalData.pr_breakdown.consistency_commits)
                            && evalData.pr_breakdown.consistency_commits.some(
                              (commit) => commit.status !== 'not_selected',
                            ) && (
                            <div className="pr-agent-details mt-3 pt-2" style={{ borderTop: '1px dashed #d8dee6' }}>
                              <button
                                type="button"
                                className="pr-agent-toggle"
                                onClick={() => setAgentDetailsOpen((open) => !open)}
                              >
                                <span className="pr-agent-toggle-heading">
                                  <span className="pr-agent-toggle-icon"><BsCodeSlash /></span>
                                  <span>
                                    <strong>정합성 검증 에이전트</strong>
                                    <small>
                                      {evalData.pr_breakdown.consistency_commits.filter((commit) => commit.status === 'success').length}
                                      /
                                      {evalData.pr_breakdown.consistency_commits.length}
                                      개 커밋을 판정에 사용
                                    </small>
                                  </span>
                                </span>
                                <span className="pr-agent-toggle-arrow">{agentDetailsOpen ? '▲' : '▼'}</span>
                              </button>
                              {agentDetailsOpen && (
                                <div className="pr-agent-commit-list">
                                  {evalData.pr_breakdown.consistency_commits
                                    .filter((commit) => commit.status !== 'not_selected')
                                    .map((commit) => {
                                      const statusMeta = {
                                        token_limit: { icon: '⚠', label: '토큰 예산 초과', className: 'warning' },
                                        unavailable: { icon: '⚠', label: '변경 내용 확인 불가', className: 'warning' },
                                        error: { icon: '!', label: '조회 실패', className: 'error' },
                                      }[commit.status] || { icon: '○', label: commit.status, className: 'neutral' };
                                      return (
                                        <div key={commit.sha} className="pr-agent-commit">
                                          <div className="pr-agent-commit-header">
                                            <div className="pr-agent-commit-title" style={{ minWidth: 0 }}>
                                              <span className="pr-agent-sha">
                                                {String(commit.sha).slice(0, 7)}
                                              </span>
                                              <span>{commit.message_headline || '(커밋 메시지 없음)'}</span>
                                            </div>
                                            {commit.status !== 'success' && (
                                              <span className={`pr-agent-status ${statusMeta.className}`}>
                                                {statusMeta.icon} {statusMeta.label}
                                              </span>
                                            )}
                                          </div>
                                          <div className="pr-agent-commit-meta">
                                            <span>파일 {commit.file_count ?? '?'}개</span>
                                            <span className="additions">+{commit.additions ?? 0}</span>
                                            <span className="deletions">-{commit.deletions ?? 0}</span>
                                          </div>
                                          {commit.summary && (
                                            <div className="pr-agent-commit-summary">
                                              <span>변경 요약</span>
                                              <p>{commit.summary}</p>
                                            </div>
                                          )}
                                          {!commit.summary && commit.status !== 'success' && commit.status_reason && (
                                            <div className="pr-agent-commit-summary unavailable">
                                              <span>확인 결과</span>
                                              <p>{commit.status_reason}</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          )}
                          {evalData.pr_breakdown.cohesion_reason && (
                            <div className="pr-consistency-result pr-cohesion-result mt-3">
                              <div className="pr-consistency-result-title">PR 응집성 평가 결과</div>
                              {(() => {
                                const status = evalData.pr_breakdown.cohesion_status;
                                const statusMeta = {
                                  cohesive: { icon: '✓', label: '커밋들이 하나의 주제로 모여 있습니다', className: 'matched' },
                                  scattered: { icon: '!', label: '서로 무관한 여러 작업이 섞여 있습니다', className: 'mismatched' },
                                  'N/A': { icon: '−', label: 'PR 응집성을 평가하지 않았습니다', className: 'na' },
                                }[status];
                                return statusMeta ? (
                                  <div className={`pr-consistency-verdict ${statusMeta.className}`}>
                                    {statusMeta.icon} {statusMeta.label}
                                  </div>
                                ) : null;
                              })()}
                              <div className="pr-consistency-result-text">
                                {evalData.pr_breakdown.cohesion_reason}
                              </div>
                              {Array.isArray(evalData.pr_breakdown.cohesion_evidence)
                                && evalData.pr_breakdown.cohesion_evidence.length > 0 && (
                                <div className="pr-consistency-evidence pr-cohesion-evidence">
                                  <div className="pr-consistency-evidence-title">판정 근거</div>
                                  <ul>
                                    {evalData.pr_breakdown.cohesion_evidence.map((item, index) => (
                                      <li key={`${index}-${item}`}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          {Array.isArray(evalData.pr_breakdown.cohesion_commits)
                            && evalData.pr_breakdown.cohesion_commits.length > 0 && (
                            <div className="pr-agent-details mt-3 pt-2" style={{ borderTop: '1px dashed #d8dee6' }}>
                              <button
                                type="button"
                                className="pr-agent-toggle"
                                onClick={() => setCohesionAgentDetailsOpen((open) => !open)}
                              >
                                <span className="pr-agent-toggle-heading">
                                  <span className="pr-agent-toggle-icon"><BsCodeSlash /></span>
                                  <span>
                                    <strong>응집성 검증 에이전트</strong>
                                    <small>
                                      {evalData.pr_breakdown.cohesion_commits.filter((commit) => commit.status === 'success').length}
                                      /
                                      {evalData.pr_breakdown.cohesion_commits.length}
                                      개 중 제목이 애매한 커밋의 diff를 확인
                                    </small>
                                  </span>
                                </span>
                                <span className="pr-agent-toggle-arrow">{cohesionAgentDetailsOpen ? '▲' : '▼'}</span>
                              </button>
                              {cohesionAgentDetailsOpen && (
                                <div className="pr-agent-commit-list">
                                  {evalData.pr_breakdown.cohesion_commits.every(
                                    (commit) => commit.status === 'not_selected',
                                  ) && (
                                    <p className="pr-agent-title-only-note">
                                      모든 커밋 제목이 명확하여 diff를 추가로 확인하지 않고 판정했습니다.
                                    </p>
                                  )}
                                  {evalData.pr_breakdown.cohesion_commits
                                    .filter((commit) => commit.status !== 'not_selected')
                                    .map((commit) => {
                                      const statusMeta = {
                                        token_limit: { icon: '⚠', label: '토큰 예산 초과', className: 'warning' },
                                        unavailable: { icon: '⚠', label: '변경 내용 확인 불가', className: 'warning' },
                                        error: { icon: '!', label: '조회 실패', className: 'error' },
                                      }[commit.status] || { icon: '○', label: commit.status, className: 'neutral' };
                                      return (
                                        <div key={commit.sha} className="pr-agent-commit">
                                          <div className="pr-agent-commit-header">
                                            <div className="pr-agent-commit-title" style={{ minWidth: 0 }}>
                                              <span className="pr-agent-sha">{String(commit.sha).slice(0, 7)}</span>
                                              <span>{commit.message_headline || '(커밋 메시지 없음)'}</span>
                                            </div>
                                            {commit.status !== 'success' && (
                                              <span className={`pr-agent-status ${statusMeta.className}`}>
                                                {statusMeta.icon} {statusMeta.label}
                                              </span>
                                            )}
                                          </div>
                                          <div className="pr-agent-commit-meta">
                                            <span>파일 {commit.file_count ?? '?'}개</span>
                                            <span className="additions">+{commit.additions ?? 0}</span>
                                            <span className="deletions">-{commit.deletions ?? 0}</span>
                                          </div>
                                          {commit.summary && (
                                            <div className="pr-agent-commit-summary">
                                              <span>변경 요약</span>
                                              <p>{commit.summary}</p>
                                            </div>
                                          )}
                                          {!commit.summary && commit.status !== 'success' && commit.status_reason && (
                                            <div className="pr-agent-commit-summary unavailable">
                                              <span>확인 결과</span>
                                              <p>{commit.status_reason}</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="feedback-box strengths">
                    <h6 className="feedback-box-title text-success">Strengths (잘한 점)</h6>
                    <ul>{evalData.pr_strengths?.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                  </div>
                  <div className="feedback-box improvements">
                    <h6 className="feedback-box-title text-warning">Improvements (보완할 점)</h6>
                    <ul>{evalData.pr_improvements?.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                  </div>
                  {evalData.pr_missing?.filter((i) => i && String(i).trim() !== '').length > 0 && (
                    <div className="feedback-box missing-essentials mb-4">
                      <h6 className="feedback-box-title text-danger">Missing Items (누락된 항목)</h6>
                      <ul>
                        {evalData.pr_missing
                          .filter((i) => i && String(i).trim() !== '')
                          .map((item, idx) => <li key={idx} className="mb-1 text-danger font-weight-bold">{item}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="feedback-box advice">
                    <h6 className="feedback-box-title text-info">Advice (조언)</h6>
                    <ul>{evalData.pr_advice?.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                  </div>
                  <div className="last-analysis-footer d-flex justify-content-between align-items-center">
                    <a
                      href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}/pull/${selectedPr.pr_number}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >GitHub PR 보러 가기 →</a>
                    <span className="text-muted small">
                      Last AI Analysis: {evalData.updated_at ? new Date(evalData.updated_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-data-box text-center text-muted border rounded mt-4">
                  <p className="mb-2">아직 AI 평가가 없습니다.</p>
                  <button
                    className="btn btn-sm btn-primary px-4"
                    onClick={() => evaluatePr(selectedPr)}
                    disabled={evalLoading}
                  >
                    AI 평가 시작
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card shadow-sm empty-selection-card d-flex flex-column align-items-center justify-content-center text-muted">
            <BsGit size={50} className="mb-3" style={{ opacity: 0.3 }} />
            <h5>Select a Pull Request</h5>
            <p className="text-center">PR을 선택하면 AI가 제목과 본문의 품질을 평가해 드립니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Issue 탭 ─────────────────────────────────────────────────────

function IssueTab({ repos, loading, errorOccur }) {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoListOpen, setRepoListOpen] = useState(true);
  const [issueCounts, setIssueCounts] = useState({});

  useEffect(() => {
    if (!repos.length) return;
    const reposParam = repos
      .map((r) => `${r.github_id || r.owner_id}/${r.repo_name}`)
      .join(',');
    axiosInstance
      .get(`/v2/ai-evaluation/issue-counts?repos=${encodeURIComponent(reposParam)}`, getAuthConfig())
      .then((res) => {
        if (res.data.status === 'success') setIssueCounts(res.data.data);
      })
      .catch((e) => console.error('이슈 카운트 조회 실패:', e));
  }, [repos]);

  const [issueList, setIssueList] = useState([]);
  const [issueListLoading, setIssueListLoading] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalData, setEvalData] = useState(null);
  const [evalError, setEvalError] = useState(null);
  const [issueBodyOpen, setIssueBodyOpen] = useState(false);
  const [issueBody, setIssueBody] = useState(null);

  const fetchIssueList = async (repo) => {
    setIssueListLoading(true);
    setIssueList([]);
    setSelectedIssue(null);
    setEvalData(null);
    setIssueBody(null);
    try {
      const githubUsername = repo.github_id || repo.owner_id;
      const res = await axiosInstance.get(
        `/v2/ai-evaluation/issue-list?githubUsername=${githubUsername}&repoName=${repo.repo_name}`,
        getAuthConfig()
      );
      if (res.data.status === 'success') setIssueList(res.data.data || []);
    } catch (e) {
      console.error('이슈 목록 조회 실패:', e);
    } finally {
      setIssueListLoading(false);
    }
  };

  const handleRepoClick = (repo) => {
    setSelectedRepo(repo);
    setEvalData(null);
    setEvalError(null);
    fetchIssueList(repo);
  };

  const fetchExistingEval = async (issue) => {
    const githubUsername = selectedRepo.github_id || selectedRepo.owner_id;
    try {
      const res = await axiosInstance.get(
        `/v2/ai-evaluation/issue?githubUsername=${githubUsername}&repoName=${selectedRepo.repo_name}&issueNumber=${issue.issue_number}`,
        getAuthConfig()
      );
      if (res.data.status === 'success' && res.data.data) {
        const data = res.data.data;
        setIssueBody(data.issue_body || null);
        if (data.evaluated) {
          setEvalData(data);
          return true;
        }
      }
    } catch {
      setIssueBody(null);
    }
    return false;
  };

  const evaluateIssue = async (issue) => {
    const githubUsername = selectedRepo.github_id || selectedRepo.owner_id;
    setEvalLoading(true);
    setEvalError(null);
    try {
      const res = await axiosInstance.post(
        '/v2/ai-evaluation/issue',
        { githubUsername, repoName: selectedRepo.repo_name, issueNumber: issue.issue_number },
        { ...getAuthConfig(), timeout: 115000 }
      );
      if (res.data.status === 'success') setEvalData(res.data.data);
      else setEvalError(res.data.message || 'AI 평가에 실패했습니다.');
    } catch (error) {
      setEvalError(error.response?.data?.message || 'AI 평가 요청에 실패했습니다.');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleIssueClick = async (issue) => {
    setSelectedIssue(issue);
    setEvalData(null);
    setEvalError(null);
    setIssueBodyOpen(false);
    setIssueBody(undefined);
    await fetchExistingEval(issue);
  };

  const gradeClass = (score) => {
    if (!score) return '';
    if (score === 'A+') return 'score-Aplus';
    return `score-${score.charAt(0).toUpperCase()}`;
  };

  if (loading) return <div className="text-center" style={{ marginTop: '100px' }}><LoaderIcon /></div>;
  if (errorOccur) return <div className="text-center mt-5">데이터를 불러오는 중 오류가 발생했습니다.</div>;

  return (
    <div className="row">
      {/* 레포 목록 */}
      <div className={repoListOpen ? 'col-md-3' : 'col-md-1'}>
        <button className="repo-section-title-btn" onClick={() => setRepoListOpen((p) => !p)}>
          <span>Repos</span>
          {repoListOpen ? <BsChevronLeft size={14} /> : <BsChevronRight size={14} />}
        </button>
        <div className={`repo-list-scroll-container${repoListOpen ? '' : ' d-none'}`}>
          {repos.length > 0 ? repos.map((repo, i) => (
            <div
              key={i}
              className={`card mb-2 shadow-sm repo-card ${selectedRepo?.repo_name === repo.repo_name ? 'selected' : ''}`}
              onClick={() => handleRepoClick(repo)}
            >
              <div className="card-body p-2">
                <h6 className="repo-card-title mb-1" style={{ fontSize: '0.85rem' }}>{repo.repo_name}</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>{repo.owner_id}</small>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>이슈 {issueCounts[repo.repo_name] ?? 0}개</small>
                </div>
              </div>
            </div>
          )) : <div className="text-muted ml-2" style={{ fontSize: '0.85rem' }}>리포지토리가 없습니다.</div>}
        </div>
      </div>

      {/* 이슈 목록 */}
      <div className="col-md-3">
        <div className="repo-section-title-btn" style={{ cursor: 'default' }}>
          <span>Issues</span>
          {selectedRepo && <small className="text-muted ml-1" style={{ fontSize: '0.75rem' }}>{issueList.length}개</small>}
        </div>
        <div className="repo-list-scroll-container">
          {!selectedRepo ? (
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>레포지토리를 선택하세요.</div>
          ) : issueListLoading ? (
            <div className="text-center mt-3"><LoaderIcon /></div>
          ) : issueList.length > 0 ? issueList.map((issue, i) => (
            <div
              key={i}
              className={`card mb-2 shadow-sm repo-card ${selectedIssue?.issue_number === issue.issue_number ? 'selected' : ''}`}
              onClick={() => handleIssueClick(issue)}
            >
              <div className="card-body p-2">
                <div className="d-flex align-items-start gap-1">
                  <BsExclamationCircle className="text-success mt-1 flex-shrink-0" size={13} />
                  <div style={{ minWidth: 0 }}>
                    <p className="mb-0 pr-title-text">
                      <span className="text-muted" style={{ fontSize: '0.78em', fontWeight: 600, marginRight: '5px' }}>#{issue.issue_number}</span>
                      {issue.title}
                    </p>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {issue.author} · {issue.date ? issue.date.split('T')[0] : ''}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>이슈가 없습니다.</div>
          )}
        </div>
      </div>

      {/* 평가 결과 */}
      <div className={repoListOpen ? 'col-md-6' : 'col-md-8'}>
        {selectedIssue ? (
          <div className="card shadow-sm ai-result-card">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div>
                <a
                  href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}/issues/${selectedIssue.issue_number}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-weight-bold ai-result-header-link"
                  style={{ fontSize: '1rem' }}
                >
                  <BsExclamationCircle className="text-success flex-shrink-0" style={{ marginRight: '8px' }} />
                  <span>#{selectedIssue.issue_number} {selectedIssue.title}</span>
                </a>
                <small className="text-muted d-block mt-1">{selectedIssue.author} · {selectedIssue.date ? selectedIssue.date.split('T')[0] : ''}</small>
              </div>
              <button
                className="btn btn-sm btn-primary px-3 shadow-sm flex-shrink-0"
                onClick={() => evaluateIssue(selectedIssue)}
                disabled={evalLoading || !evalData}
                title={!evalData ? '먼저 AI 평가를 실행해 주세요.' : ''}
              >
                {evalLoading ? '평가 중...' : 'AI 재평가'}
              </button>
            </div>
            <div className="card-body ai-result-body">
              {issueBody !== undefined && (
                issueBody
                  ? (
                    <div className="readme-section mb-3">
                      <button
                        className="btn btn-sm btn-outline-secondary w-100 text-left d-flex justify-content-between align-items-center"
                        onClick={() => setIssueBodyOpen((p) => !p)}
                      >
                        <span>이슈 본문 보기</span>
                        <span>{issueBodyOpen ? '▲' : '▼'}</span>
                      </button>
                      {issueBodyOpen && (
                        <div className="readme-content mt-2 p-3 bg-light border rounded">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdImgComponents}>{issueBody}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )
                  : <p className="text-muted small mb-3">이슈 본문이 없습니다.</p>
              )}

              <h6 className="ai-analysis-title"><BsChatLeftDots className="mr-2 text-info" /> AI 평가 결과</h6>

              {evalError && <div className="alert alert-warning mt-3" role="alert">⚠️ {evalError}</div>}

              {evalLoading ? (
                <div className="text-center py-5 mt-4">
                  <LoaderIcon />
                  <p className="mt-3 text-muted">AI가 이슈를 분석 중입니다...</p>
                </div>
              ) : evalData ? (
                <div className="mt-3">
                  {evalData.issue_type === 'skip' ? (
                    <div className="alert alert-secondary mt-3" role="alert" style={{ borderLeft: '4px solid #6c757d' }}>
                      <strong>평가 제외 이슈</strong>
                      <p className="mb-0 mt-1" style={{ fontSize: '0.9rem' }}>{evalData.skip_message}</p>
                    </div>
                  ) : (
                    <>
                      {evalData.issue_score && (
                        <div className="mb-4 p-3 bg-light rounded score-container">
                          <div className="d-flex align-items-center mb-2">
                            <div className={`score-badge ${gradeClass(evalData.issue_score)}`}>
                              {evalData.issue_score}
                            </div>
                            <div className="ml-3">
                              <h6 className="mb-1 font-weight-bold">Issue Quality Score</h6>
                              <p className="mb-0 text-muted small">
                                {evalData.issue_total_score != null
                                  ? `${evalData.issue_total_score} / 6점 · ${evalData.issue_type === 'bug' ? '버그 리포트' : '기능 제안'}`
                                  : '충실도 (0~3) + 명료성 (0~1) + 보너스 (0~2) = 최대 6점'}
                              </p>
                            </div>
                          </div>
                          {evalData.issue_breakdown && (
                            <div className="d-flex" style={{ gap: '16px', alignItems: 'flex-start', borderTop: '1px solid #dee2e6', paddingTop: '0.75rem' }}>
                              <div className="criteria-scores" style={{ flex: 1, borderTop: 'none', paddingTop: 0 }}>
                                {[
                                  { label: '충실도', score: evalData.issue_breakdown.fulfilment ?? 0, max: 3 },
                                  { label: '명료성', score: evalData.issue_breakdown.clarity ?? 0,    max: 1 },
                                  { label: '보너스', score: evalData.issue_breakdown.bonus ?? 0,       max: 2 },
                                ].map(({ label, score, max }) => (
                                  <div key={label} className="criteria-row">
                                    <span className="criteria-label">{label}</span>
                                    <div className="criteria-bar-wrap">
                                      <div className="criteria-bar" style={{ width: `${(score / max) * 100}%` }} />
                                    </div>
                                    <span className="criteria-score">{score} / {max}</span>
                                  </div>
                                ))}
                                <div className="bonus-checklist">
                                  {[
                                    { key: evalData.issue_type === 'bug' ? '재현 자료' : '참고 자료', pts: '1' },
                                    { key: '제목 태그', pts: '0.5' },
                                    { key: '이슈/PR 연결', pts: '0.5' },
                                  ].map(({ key, pts }) => {
                                    const passed = evalData.issue_breakdown.bonus_earned?.includes(key);
                                    return (
                                      <span key={key} className={`bonus-item ${passed ? 'bonus-pass' : 'bonus-fail'}`}>
                                        {passed ? '✓' : '✗'} {key}
                                        {passed && <span className="bonus-point"> +{pts}점</span>}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div style={{ flexShrink: 0, marginTop: '-8px' }}>
                                <RadarChart axes={[
                                  { label: '충실도', value: evalData.issue_breakdown.fulfilment ?? 0, max: 3 },
                                  { label: '명료성', value: evalData.issue_breakdown.clarity ?? 0,    max: 1 },
                                  { label: '보너스', value: evalData.issue_breakdown.bonus ?? 0,       max: 2 },
                                ]} size={130} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="feedback-box strengths">
                        <h6 className="feedback-box-title text-success">Strengths (잘한 점)</h6>
                        <ul>{evalData.issue_strengths?.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                      </div>
                      <div className="feedback-box improvements">
                        <h6 className="feedback-box-title text-warning">Improvements (보완할 점)</h6>
                        <ul>{evalData.issue_improvements?.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                      </div>
                      {evalData.issue_missing?.filter((i) => i && String(i).trim() !== '').length > 0 && (
                        <div className="feedback-box missing-essentials mb-4">
                          <h6 className="feedback-box-title text-danger">Missing Items (누락된 항목)</h6>
                          <ul>
                            {evalData.issue_missing
                              .filter((i) => i && String(i).trim() !== '')
                              .map((item, idx) => <li key={idx} className="mb-1 text-danger font-weight-bold">{item}</li>)}
                          </ul>
                        </div>
                      )}
                      <div className="feedback-box advice">
                        <h6 className="feedback-box-title text-info">Advice (조언)</h6>
                        <ul>{evalData.issue_advice?.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                      </div>
                    </>
                  )}
                  <div className="last-analysis-footer d-flex justify-content-between align-items-center">
                    <a
                      href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}/issues/${selectedIssue.issue_number}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >GitHub 이슈 보러 가기 →</a>
                    <span className="text-muted small">
                      Last AI Analysis: {evalData.updated_at ? new Date(evalData.updated_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-data-box text-center text-muted border rounded mt-4">
                  <p className="mb-2">아직 AI 평가가 없습니다.</p>
                  <button
                    className="btn btn-sm btn-primary px-4"
                    onClick={() => evaluateIssue(selectedIssue)}
                    disabled={evalLoading}
                  >
                    AI 평가 시작
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card shadow-sm empty-selection-card d-flex flex-column align-items-center justify-content-center text-muted">
            <BsExclamationCircle size={50} className="mb-3" style={{ opacity: 0.3 }} />
            <h5>Select an Issue</h5>
            <p className="text-center">이슈를 선택하면 AI가 제목과 본문의 품질을 평가해 드립니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Commit 탭 ────────────────────────────────────────────────────

function CommitTab({ repos, loading, errorOccur }) {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoListOpen, setRepoListOpen] = useState(true);
  const [commitCounts, setCommitCounts] = useState({});
  const [commitList, setCommitList] = useState([]);
  const [commitListLoading, setCommitListLoading] = useState(false);
  const [commitListError, setCommitListError] = useState(null);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalData, setEvalData] = useState(null);
  const [evalError, setEvalError] = useState(null);
  const [filesOpen, setFilesOpen] = useState(false);
  const [messageBodyOpen, setMessageBodyOpen] = useState(false);
  const [fileSummaries, setFileSummaries] = useState(null);
  const [fileSummariesLoading, setFileSummariesLoading] = useState(false);
  const [fileSummariesError, setFileSummariesError] = useState(null);
  const fileSummaryRequestId = useRef(0);

  useEffect(() => {
    if (!repos.length) return;
    const reposParam = repos
      .map((r) => `${r.github_id || r.owner_id}/${r.repo_name}`)
      .join(',');
    axiosInstance
      .get(`/v2/ai-evaluation/commit-counts?repos=${encodeURIComponent(reposParam)}`, getAuthConfig())
      .then((res) => {
        if (res.data.status === 'success') setCommitCounts(res.data.data || {});
      })
      .catch((e) => console.error('커밋 카운트 조회 실패:', e));
  }, [repos]);

  const fetchCommitList = async (repo) => {
    setCommitListLoading(true);
    setCommitList([]);
    setCommitListError(null);
    setSelectedCommit(null);
    setEvalData(null);
    setFileSummaries(null);
    setFileSummariesError(null);
    try {
      const githubUsername = repo.github_id || repo.owner_id;
      const res = await axiosInstance.get(
        `/v2/ai-evaluation/commit-list?githubUsername=${encodeURIComponent(githubUsername)}&repoName=${encodeURIComponent(repo.repo_name)}`,
        getAuthConfig()
      );
      if (res.data.status === 'success') setCommitList(res.data.data || []);
      else setCommitListError(res.data.message || '커밋 목록을 불러오지 못했습니다.');
    } catch (error) {
      setCommitListError(error.response?.data?.message || '커밋 평가 API가 아직 연결되지 않았습니다.');
    } finally {
      setCommitListLoading(false);
    }
  };

  const handleRepoClick = (repo) => {
    fileSummaryRequestId.current += 1;
    setSelectedRepo(repo);
    setEvalData(null);
    setEvalError(null);
    setFileSummaries(null);
    setFileSummariesLoading(false);
    setFileSummariesError(null);
    fetchCommitList(repo);
  };

  const fetchExistingEval = async (commit) => {
    const githubUsername = selectedRepo.github_id || selectedRepo.owner_id;
    try {
      const res = await axiosInstance.get(
        `/v2/ai-evaluation/commit?githubUsername=${encodeURIComponent(githubUsername)}&repoName=${encodeURIComponent(selectedRepo.repo_name)}&sha=${encodeURIComponent(commit.sha)}`,
        getAuthConfig()
      );
      if (res.data.status === 'success' && res.data.data) {
        const data = res.data.data;
        if (data.evaluated) {
          setEvalData(data);
          return true;
        }
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        setEvalError(error.response?.data?.message || '기존 평가를 불러오지 못했습니다.');
      }
    }
    return false;
  };

  const evaluateCommit = async (commit) => {
    const githubUsername = selectedRepo.github_id || selectedRepo.owner_id;
    setEvalLoading(true);
    setEvalError(null);
    try {
      const res = await axiosInstance.post(
        '/v2/ai-evaluation/commit',
        { githubUsername, repoName: selectedRepo.repo_name, sha: commit.sha },
        { ...getAuthConfig(), timeout: 180000 }
      );
      if (res.data.status === 'success') {
        setEvalData(res.data.data);
      }
      else setEvalError(res.data.message || 'AI 평가에 실패했습니다.');
    } catch (error) {
      setEvalError(error.response?.data?.message || 'AI 평가 요청에 실패했습니다.');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleCommitClick = async (commit) => {
    fileSummaryRequestId.current += 1;
    setSelectedCommit(commit);
    setEvalData(null);
    setEvalError(null);
    setFilesOpen(false);
    setMessageBodyOpen(false);
    setFileSummaries(null);
    setFileSummariesLoading(false);
    setFileSummariesError(null);
    await fetchExistingEval(commit);
  };

  const gradeClass = (score) => {
    if (!score) return '';
    if (score === 'A+') return 'score-Aplus';
    return `score-${String(score).charAt(0).toUpperCase()}`;
  };

  const commitTitle = (commit) => (commit?.message || '커밋 메시지가 없습니다.').split('\n')[0];
  const commitAuthor = (commit) => commit?.author || commit?.author_github || commit?.github_id || 'Unknown';
  const commitDate = (commit) => commit?.date || commit?.committer_date || commit?.author_date;
  const formatDate = (date) => (date ? String(date).split('T')[0] : '');
  const changedFiles = evalData?.files || evalData?.commit_files || [];
  const loadFileSummaries = async () => {
    if (!selectedRepo || !selectedCommit || fileSummariesLoading || fileSummaries !== null) return;
    const githubUsername = selectedRepo.github_id || selectedRepo.owner_id;
    const requestId = ++fileSummaryRequestId.current;
    setFileSummariesLoading(true);
    setFileSummariesError(null);
    try {
      const res = await axiosInstance.post(
        '/v2/ai-evaluation/commit-file-summaries',
        { githubUsername, repoName: selectedRepo.repo_name, sha: selectedCommit.sha },
        { ...getAuthConfig(), timeout: 180000 }
      );
      if (requestId !== fileSummaryRequestId.current) return;
      if (res.data.status === 'success') {
        setFileSummaries(res.data.data?.summaries || {});
      } else {
        setFileSummariesError(res.data.message || '파일 변경 요약을 불러오지 못했습니다.');
      }
    } catch (error) {
      if (requestId !== fileSummaryRequestId.current) return;
      setFileSummariesError(error.response?.data?.message || '파일 변경 요약을 불러오지 못했습니다.');
    } finally {
      if (requestId === fileSummaryRequestId.current) setFileSummariesLoading(false);
    }
  };
  const handleFilesToggle = () => {
    const nextOpen = !filesOpen;
    setFilesOpen(nextOpen);
    if (nextOpen) loadFileSummaries();
  };
  const strengths = evalData?.commit_strengths || evalData?.strengths || [];
  const improvements = evalData?.commit_improvements || evalData?.improvements || [];
  const advice = evalData?.commit_advice || evalData?.advice || [];
  const breakdown = evalData?.commit_breakdown || {};
  const breakdownRows = ['message_clarity', 'consistency', 'atomicity', 'convention']
    .filter((key) => Object.prototype.hasOwnProperty.call(breakdown, key))
    .map((key) => [key, breakdown[key]]);
  const criteriaLabels = {
    message: '메시지 품질',
    message_quality: '메시지 품질',
    message_clarity: '메시지 명료성',
    consistency: '변경 정합성',
    atomicity: '원자성',
    convention: '커밋 컨벤션',
    change_focus: '원자성',
    implementation: '구현 품질',
    code_quality: '코드 품질',
    test_quality: '테스트 품질',
    bonus: '보너스',
  };
  const criterionMax = (key) => evalData?.commit_breakdown_max?.[key] ?? 5;
  const criterionNaReason = (key) => {
    const rawReason = key === 'consistency'
      ? breakdown.consistency_reason
      : key === 'atomicity'
      ? breakdown.atomicity_reason
      : null;
    if (!rawReason) return '평가에 필요한 정보가 충분하지 않아 이 항목은 점수에서 제외했습니다.';

    // 이전 평가 결과에 저장된 내부 용어도 사용자에게 쉬운 표현으로 보여준다.
    if (key === 'consistency' && rawReason.includes('메시지가 부실')) {
      return '커밋 메시지만으로는 무엇을 변경했는지 알기 어려워 실제 코드와 비교하지 않았습니다.';
    }
    if (key === 'consistency' && rawReason.includes('patch') && rawReason.includes('없어')) {
      return '비교할 수 있는 소스 코드 변경 내용이 없어 메시지와 코드의 일치 여부를 평가하지 않았습니다.';
    }
    if (key === 'consistency' && (rawReason.includes('토큰') || rawReason.includes('상한'))) {
      return '코드 변경 내용이 너무 커서 정확히 비교하기 어렵습니다. 커밋을 더 작은 단위로 나누어 주세요.';
    }
    if (key === 'atomicity' && rawReason.includes('자동 생성물만')) {
      return '직접 작성한 소스 코드 변경이 없어 한 가지 작업에 집중했는지 평가하지 않았습니다.';
    }
    if (key === 'atomicity' && rawReason.includes('대규모 변경')) {
      return '변경한 파일이 너무 많아 한 가지 작업에 집중한 커밋인지 정확히 판단하기 어렵습니다.';
    }
    return rawReason;
  };
  const commitRadarAxes = [
    { label: '메시지 명료성', value: breakdown.message_clarity, max: criterionMax('message_clarity') },
    { label: '변경 정합성', value: breakdown.consistency, max: criterionMax('consistency') },
    { label: '원자성', value: breakdown.atomicity, max: criterionMax('atomicity') },
    { label: '컨벤션', value: breakdown.convention, max: criterionMax('convention') },
  ].filter((axis) => typeof axis.value === 'number');

  if (loading) return <div className="text-center" style={{ marginTop: '100px' }}><LoaderIcon /></div>;
  if (errorOccur) return <div className="text-center mt-5">데이터를 불러오는 중 오류가 발생했습니다.</div>;

  return (
    <div className="row">
      {/* 레포 목록 */}
      <div className={repoListOpen ? 'col-md-3' : 'col-md-1'}>
        <button className="repo-section-title-btn" onClick={() => setRepoListOpen((p) => !p)}>
          <span>Repos</span>
          {repoListOpen ? <BsChevronLeft size={14} /> : <BsChevronRight size={14} />}
        </button>
        <div className={`repo-list-scroll-container${repoListOpen ? '' : ' d-none'}`}>
          {repos.length > 0 ? repos.map((repo, i) => (
            <div
              key={`${repo.owner_id}-${repo.repo_name}-${i}`}
              className={`card mb-2 shadow-sm repo-card ${selectedRepo?.repo_name === repo.repo_name ? 'selected' : ''}`}
              onClick={() => handleRepoClick(repo)}
            >
              <div className="card-body p-2">
                <h6 className="repo-card-title mb-1" style={{ fontSize: '0.85rem' }}>{repo.repo_name}</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>{repo.owner_id}</small>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    커밋 {commitCounts[`${repo.github_id || repo.owner_id}/${repo.repo_name}`] ?? 0}개
                  </small>
                </div>
              </div>
            </div>
          )) : <div className="text-muted ml-2" style={{ fontSize: '0.85rem' }}>리포지토리가 없습니다.</div>}
        </div>
      </div>

      {/* 커밋 목록 */}
      <div className="col-md-3">
        <div className="repo-section-title-btn" style={{ cursor: 'default' }}>
          <span>Commits</span>
          {selectedRepo && <small className="text-muted ml-1" style={{ fontSize: '0.75rem' }}>{commitList.length}개</small>}
        </div>
        <div className="repo-list-scroll-container">
          {!selectedRepo ? (
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>레포지토리를 선택하세요.</div>
          ) : commitListLoading ? (
            <div className="text-center mt-3"><LoaderIcon /></div>
          ) : commitListError ? (
            <div className="alert alert-light border text-muted small">{commitListError}</div>
          ) : commitList.length > 0 ? commitList.map((commit) => (
            <div
              key={commit.sha}
              className={`card mb-2 shadow-sm repo-card ${selectedCommit?.sha === commit.sha ? 'selected' : ''}`}
              onClick={() => handleCommitClick(commit)}
            >
              <div className="card-body p-2">
                <div className="d-flex align-items-start gap-1">
                  <BsCodeSlash className="text-primary mt-1 flex-shrink-0" size={13} />
                  <div style={{ minWidth: 0, width: '100%' }}>
                    <p className="mb-0 pr-title-text commit-title-text">{commitTitle(commit)}</p>
                    <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                      <code>{commit.sha.slice(0, 7)}</code> · {commitAuthor(commit)} · {formatDate(commitDate(commit))}
                    </small>
                    {(commit.additions != null || commit.deletions != null) && (
                      <small className="commit-change-summary">
                        <span className="commit-additions">+{commit.additions ?? 0}</span>
                        <span className="commit-deletions">-{commit.deletions ?? 0}</span>
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>커밋이 없습니다.</div>
          )}
        </div>
      </div>

      {/* 평가 결과 */}
      <div className={repoListOpen ? 'col-md-6' : 'col-md-8'}>
        {selectedCommit ? (
          <div className="card shadow-sm ai-result-card">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div style={{ minWidth: 0 }}>
                <a
                  href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}/commit/${selectedCommit.sha}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-weight-bold ai-result-header-link"
                  style={{ fontSize: '1rem' }}
                >
                  <BsCodeSlash className="text-primary flex-shrink-0" style={{ marginRight: '8px' }} />
                  <span className="commit-header-title">{commitTitle(selectedCommit)}</span>
                </a>
                <small className="text-muted d-block mt-1">
                  <code>{selectedCommit.sha.slice(0, 7)}</code> · {commitAuthor(selectedCommit)} · {formatDate(commitDate(selectedCommit))}
                  {(selectedCommit.additions != null || selectedCommit.deletions != null) && (
                    <> · <span className="commit-additions">+{selectedCommit.additions ?? 0}</span> <span className="commit-deletions">-{selectedCommit.deletions ?? 0}</span></>
                  )}
                </small>
              </div>
              <button
                className="btn btn-sm btn-primary px-3 shadow-sm flex-shrink-0"
                onClick={() => evaluateCommit(selectedCommit)}
                disabled={evalLoading || !evalData || evalData?.evaluation_status === 'skipped'}
                title={!evalData ? '먼저 AI 평가를 실행해 주세요.' : ''}
              >
                {evalLoading
                  ? '평가 중...'
                  : evalData?.evaluation_status === 'skipped'
                  ? '평가 제외'
                  : 'AI 재평가'}
              </button>
            </div>
            <div className="card-body ai-result-body">
              {selectedCommit.message_body && (
                <div className="readme-section mb-3">
                  <button
                    className="btn btn-sm btn-outline-secondary w-100 text-left d-flex justify-content-between align-items-center"
                    onClick={() => setMessageBodyOpen((previous) => !previous)}
                  >
                    <span>커밋 메시지 본문 보기</span>
                    <span>{messageBodyOpen ? '▲' : '▼'}</span>
                  </button>
                  {messageBodyOpen && (
                    <div className="readme-content mt-2 p-3 bg-light border rounded">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedCommit.message_body}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
              {changedFiles.length > 0 && (
                <div className="readme-section mb-3">
                  <button
                    className="btn btn-sm btn-outline-secondary w-100 text-left d-flex justify-content-between align-items-center"
                    onClick={handleFilesToggle}
                  >
                    <span>변경 파일 보기 ({changedFiles.length}개)</span>
                    <span>{filesOpen ? '▲' : '▼'}</span>
                  </button>
                  {filesOpen && (
                    <div className="commit-file-list mt-2 border rounded">
                      {fileSummariesLoading && (
                        <div className="commit-file-summary-state">
                          <LoaderIcon /> 파일별 변경 내용을 요약하고 있습니다.
                        </div>
                      )}
                      {fileSummariesError && (
                        <div className="commit-file-summary-state text-danger">
                          {fileSummariesError}
                        </div>
                      )}
                      {changedFiles.map((file, index) => (
                        <div className="commit-file-row" key={`${file.filename || file.path}-${index}`}>
                          <div className="commit-file-main-row">
                            <span className="commit-file-name">{file.filename || file.path}</span>
                            <span className="commit-file-change-count">
                              <span className="commit-additions">+{file.additions ?? 0}</span>
                              <span className="commit-deletions ml-2">-{file.deletions ?? 0}</span>
                            </span>
                          </div>
                          <div className={`commit-file-summary ${fileSummaries?.[file.filename || file.path]?.status || ''}`}>
                            {fileSummaries?.[file.filename || file.path]?.summary
                              || (fileSummariesLoading ? '요약 생성 중...' : '요약을 불러오지 못했습니다.')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <h6 className="ai-analysis-title"><BsChatLeftDots className="mr-2 text-info" /> AI 평가 결과</h6>
              {evalError && <div className="alert alert-warning mt-3" role="alert">⚠️ {evalError}</div>}

              {evalLoading ? (
                <div className="text-center py-5 mt-4">
                  <LoaderIcon />
                  <p className="mt-3 mb-2 font-weight-bold">커밋 평가를 진행하고 있습니다</p>
                  <p className="pr-agent-loading-status">
                    <span /> 커밋 메시지와 코드 변경 내용을 분석하고 있습니다.<br />
                    코드 변경량에 따라 시간이 오래 소요될 수 있습니다.
                  </p>
                </div>
              ) : evalData?.evaluation_status === 'skipped' ? (
                <div className="alert alert-secondary mt-4 mb-0 text-center py-4" role="status">
                  <BsGit className="mr-2" />
                  <strong>{evalData.skip_reason || '이 커밋은 평가 대상이 아닙니다.'}</strong>
                </div>
              ) : evalData ? (
                <div className="mt-3">
                  {evalData.commit_total_score != null && (
                    <div className="mb-4 p-3 bg-light rounded score-container">
                      <div className="d-flex align-items-center mb-2">
                        <div className={`score-badge ${evalData.commit_score ? gradeClass(evalData.commit_score) : 'score-provisional'}`}>
                          {evalData.commit_score || '잠정'}
                        </div>
                        <div className="ml-3">
                          <h6 className="mb-1 font-weight-bold">
                            Commit Quality Score{evalData.is_provisional ? ' (잠정)' : ''}
                          </h6>
                          <p className="mb-0 text-muted small">
                            {evalData.commit_total_score != null
                              ? `${evalData.commit_total_score} / ${evalData.commit_full_max_score ?? 6}점`
                              : '커밋 메시지와 변경 내용의 품질을 종합한 점수입니다.'}
                          </p>
                          {evalData.is_provisional && (
                            <p className="mb-0 text-muted" style={{ fontSize: '0.72rem' }}>
                              변경 정합성 2점은 아직 미평가이며 등급은 정합성 구현 후 확정됩니다.
                            </p>
                          )}
                        </div>
                      </div>
                      {breakdownRows.length > 0 && (
                        <div className="d-flex" style={{ gap: '16px', alignItems: 'flex-start', borderTop: '1px solid #dee2e6', paddingTop: '0.75rem' }}>
                          <div className="criteria-scores" style={{ flex: 1, borderTop: 'none', paddingTop: 0 }}>
                            {breakdownRows.map(([key, score]) => {
                              const max = criterionMax(key);
                              return (
                                <div key={key} className="criteria-row-group">
                                  <div className="criteria-row">
                                    <span className="criteria-label">{criteriaLabels[key] || key}</span>
                                    <div className="criteria-bar-wrap">
                                      <div className="criteria-bar" style={{ width: `${score == null ? 0 : Math.min((score / max) * 100, 100)}%` }} />
                                    </div>
                                    <span className="criteria-score">{score == null ? `N/A / ${max}` : `${score} / ${max}`}</span>
                                  </div>
                                  {score == null && (
                                    <div className="criteria-na-reason">
                                      <strong>평가 제외 이유:</strong> {criterionNaReason(key)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {commitRadarAxes.length >= 3 && (
                            <div style={{ flexShrink: 0, marginTop: '-8px' }}>
                              <RadarChart axes={commitRadarAxes} size={150} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {strengths.length > 0 && (
                    <div className="feedback-box strengths">
                      <h6 className="feedback-box-title text-success">Strengths (잘한 점)</h6>
                      <ul>{strengths.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                    </div>
                  )}
                  {improvements.length > 0 && (
                    <div className="feedback-box improvements">
                      <h6 className="feedback-box-title text-warning">Improvements (보완할 점)</h6>
                      <ul>{improvements.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                    </div>
                  )}
                  {advice.length > 0 && (
                    <div className="feedback-box advice">
                      <h6 className="feedback-box-title text-info">Advice (조언)</h6>
                      <ul>{advice.map((item, idx) => <li key={idx} className="mb-1">{item}</li>)}</ul>
                    </div>
                  )}
                  <div className="last-analysis-footer d-flex justify-content-between align-items-center">
                    <a
                      href={`https://github.com/${selectedRepo.owner_id}/${selectedRepo.repo_name}/commit/${selectedCommit.sha}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >GitHub 커밋 보러 가기 →</a>
                    <span className="text-muted small">
                      Last AI Analysis: {evalData.updated_at ? new Date(evalData.updated_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-data-box text-center text-muted border rounded mt-4">
                  <p className="mb-2">아직 AI 평가가 없습니다.</p>
                  <button className="btn btn-sm btn-primary px-4" onClick={() => evaluateCommit(selectedCommit)} disabled={evalLoading}>
                    AI 평가 시작
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card shadow-sm empty-selection-card d-flex flex-column align-items-center justify-content-center text-muted">
            <BsCodeSlash size={50} className="mb-3" style={{ opacity: 0.3 }} />
            <h5>Select a Commit</h5>
            <p className="text-center">커밋을 선택하면 AI가 메시지와 변경 내용의 품질을 평가해 드립니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────

function AiEvaluation() {
  const { username } = useParams();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorOccur, setErrorOccur] = useState(false);
  const [activeTab, setActiveTab] = useState('readme');
  // 'readme' | 'pr' | 'issue' | 'commit'

  useEffect(() => {
    const getRepoList = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/user/api/guideline/' + username + '/', getAuthConfig());
        const res = response.data;
        if (res.status === 'success') setRepos(res.data.guideline);
        else setErrorOccur(true);
      } catch {
        setErrorOccur(true);
      } finally {
        setLoading(false);
      }
    };
    getRepoList();
  }, [username]);

  return (
    <div className="container ai-eval-container">
      <div className="ai-tab-nav">
        <button
          className={`ai-tab-item${activeTab === 'readme' ? ' active' : ''}`}
          onClick={() => setActiveTab('readme')}
        >
          <BsFileEarmarkText size={14} />
          README 평가
        </button>
        <button
          className={`ai-tab-item${activeTab === 'pr' ? ' active' : ''}`}
          onClick={() => setActiveTab('pr')}
        >
          <BsGit size={14} />
          PR 평가
        </button>
        <button
          className={`ai-tab-item${activeTab === 'issue' ? ' active' : ''}`}
          onClick={() => setActiveTab('issue')}
        >
          <BsExclamationCircle size={14} />
          이슈 평가
        </button>
        <button
          className={`ai-tab-item${activeTab === 'commit' ? ' active' : ''}`}
          onClick={() => setActiveTab('commit')}
        >
          <BsCodeSlash size={14} />
          커밋 평가
        </button>
      </div>

      <div className="ai-eval-description">
        {activeTab === 'readme'
          ? 'AI 모델을 활용해 레포지토리 README의 품질과 수준을 분석하고, 구체적인 개선점을 제안합니다.'
          : activeTab === 'pr'
          ? 'AI 모델을 활용해 Pull Request의 제목과 본문 품질을 분석하고, 더 나은 PR 작성법을 안내합니다.'
          : activeTab === 'issue'
          ? 'AI 모델을 활용해 이슈의 제목과 본문 품질을 분석하고, 더 나은 이슈 작성법을 안내합니다.'
          : 'AI 모델을 활용해 커밋 메시지와 코드 변경의 품질을 분석하고, 더 나은 커밋 작성법을 안내합니다.'}
      </div>

      {activeTab === 'readme'
        ? <ReadmeTab repos={repos} loading={loading} errorOccur={errorOccur} />
        : activeTab === 'pr'
        ? <PrTab repos={repos} loading={loading} errorOccur={errorOccur} />
        : activeTab === 'issue'
        ? <IssueTab repos={repos} loading={loading} errorOccur={errorOccur} />
        : <CommitTab repos={repos} loading={loading} errorOccur={errorOccur} />}
    </div>
  );
}

export default AiEvaluation;
