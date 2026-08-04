import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BsStar, BsChatLeftDots, BsArrowRightShort, BsGithub, BsChevronLeft, BsChevronRight, BsGit, BsFileEarmarkText } from 'react-icons/bs';
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
                  <p className="mb-0">분석된 데이터가 없습니다. 상단의 'AI 재평가' 버튼을 눌러 분석을 시작하세요.</p>
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
  const [evalData, setEvalData] = useState(null);
  const [evalError, setEvalError] = useState(null);
  const [prBodyOpen, setPrBodyOpen] = useState(false);
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
    } catch {}
    return false;
  };

  const evaluatePr = async (pr) => {
    const githubUsername = selectedRepo.github_id || selectedRepo.owner_id;
    setEvalLoading(true);
    setEvalError(null);
    try {
      const res = await axiosInstance.post(
        '/v2/ai-evaluation/pr',
        { githubUsername, repoName: selectedRepo.repo_name, prNumber: pr.pr_number },
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

  const handlePrClick = async (pr) => {
    setSelectedPr(pr);
    setEvalData(null);
    setEvalError(null);
    setPrBodyOpen(false);
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
                  <BsGit className="mr-1 text-success" />
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
                  <p className="mt-3 text-muted">AI가 PR을 분석 중입니다...</p>
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
                              ? `${evalData.pr_total_score} / 6점`
                              : '충실도 (0~3) + 명료성 (0~1) + 보너스 (0~2) = 최대 6점'}
                          </p>
                        </div>
                      </div>
                      {evalData.pr_breakdown && (
                        <div className="d-flex" style={{ gap: '16px', alignItems: 'flex-start', borderTop: '1px solid #dee2e6', paddingTop: '0.75rem' }}>
                          <div className="criteria-scores" style={{ flex: 1, borderTop: 'none', paddingTop: 0 }}>
                            {[
                              { label: '설명 충실도', score: evalData.pr_breakdown.fulfilment ?? 0, max: 3 },
                              { label: '목적 명료성', score: evalData.pr_breakdown.clarity ?? 0, max: 1 },
                              { label: '보너스',     score: evalData.pr_breakdown.bonus ?? 0,      max: 2 },
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
                              { label: '보너스', value: evalData.pr_breakdown.bonus ?? 0, max: 2 },
                            ]} size={130} />
                          </div>
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

// ── 메인 컴포넌트 ─────────────────────────────────────────────────

function AiEvaluation() {
  const { username } = useParams();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorOccur, setErrorOccur] = useState(false);
  const [activeTab, setActiveTab] = useState('readme');

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
      </div>

      <div className="ai-eval-description">
        {activeTab === 'readme'
          ? 'AI 모델을 활용해 레포지토리 README의 품질과 수준을 분석하고, 구체적인 개선점을 제안합니다.'
          : 'AI 모델을 활용해 Pull Request의 제목과 본문 품질을 분석하고, 더 나은 PR 작성법을 안내합니다.'}
      </div>

      {activeTab === 'readme'
        ? <ReadmeTab repos={repos} loading={loading} errorOccur={errorOccur} />
        : <PrTab repos={repos} loading={loading} errorOccur={errorOccur} />}
    </div>
  );
}

export default AiEvaluation;