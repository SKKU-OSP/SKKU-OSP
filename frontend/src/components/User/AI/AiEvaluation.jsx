import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BsStar, BsChatLeftDots, BsArrowRightShort, BsGithub } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import axios from 'axios';
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
        const url = '/user/api/guideline/' + username + '/';
        const response = await axiosInstance.get(url, getAuthConfig());
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

  const [readmeLoading, setReadmeLoading] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);

  const fetchAiEvaluation = async (githubId, repoName) => {
    try {
      const url = `/user/api/ai-evaluation/?github_id=${githubId}&repo_name=${repoName}`;
      const response = await axiosInstance.get(url, getAuthConfig());
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

  const evaluateReadme = async (githubId, repoName, readmeContent) => {
    setEvaluationLoading(true);
    try {
      const url = '/user/api/ai-evaluation/';
      const response = await axiosInstance.post(
        url,
        {
          github_id: githubId,
          repo_name: repoName,
          readme_content: readmeContent
        },
        {
          ...getAuthConfig(),
          timeout: 60000
        }
      );

      if (response.data.status === 'success') {
        setEvaluationData(response.data.data);
      } else {
        alert('AI 평가 중 오류가 발생했습니다: ' + response.data.message);
      }
    } catch (error) {
      console.error('AI Evaluation failed:', error);
      alert('AI 평가 요청에 실패했습니다.');
    } finally {
      setEvaluationLoading(false);
    }
  };

  const handleRepoClick = async (repo) => {
    setSelectedRepo(repo);
    setReadmeLoading(true);
    setEvaluationData(null);

    const githubId = repo.github_id || repo.owner_id;

    try {
      const hasData = await fetchAiEvaluation(githubId, repo.repo_name);
      const response = await axios
        .get(`https://api.github.com/repos/${repo.owner_id}/${repo.repo_name}/readme`)
        .catch(() => null);
      let decodedContent = '';
      if (response && response.data && response.data.content) {
        decodedContent = b64DecodeUnicode(response.data.content);
        setSelectedRepo((prev) => ({ ...prev, readme_content: decodedContent }));
      }
      if (!hasData && decodedContent) {
        evaluateReadme(githubId, repo.repo_name, decodedContent);
      }
    } catch (error) {
      console.error('Failed to handle repo click:', error);
    } finally {
      setReadmeLoading(false);
    }
  };

  const b64DecodeUnicode = (str) => {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
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
      <div className="community-nav d-flex mb-4 ai-eval-nav">
        <div className="nav nav-fill">
          <li className="nav-item selected-nav-item">
            <div>AI README Evaluation</div>
          </li>
        </div>
      </div>

      <div className="row">
        {/* 왼쪽: 레포지토리 목록 */}
        <div className="col-md-5">
          <h5 className="repo-section-title">Repositories</h5>
          <div className="repo-list-scroll-container">
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
        <div className="col-md-7">
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
                    evaluateReadme(
                      selectedRepo.github_id || selectedRepo.owner_id,
                      selectedRepo.repo_name,
                      selectedRepo.readme_content
                    )
                  }
                  disabled={evaluationLoading || !selectedRepo.readme_content}
                >
                  {evaluationLoading ? 'Evaluating...' : 'AI Re-evaluate'}
                </button>
              </div>
              <div className="card-body ai-result-body">
                <h6 className="ai-analysis-title">
                  <BsChatLeftDots className="mr-2 text-info" /> AI README Analysis Result
                </h6>

                {evaluationLoading || readmeLoading ? (
                  <div className="text-center py-5 mt-4">
                    <LoaderIcon />
                    <p className="mt-3 text-muted">
                      {readmeLoading ? 'README를 불러오는 중...' : 'AI가 분석 중입니다...'}
                    </p>
                  </div>
                ) : evaluationData ? (
                  <div className="mt-4">
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

                    <div className="last-analysis-footer d-flex justify-content-end align-items-center">
                      <span className="text-muted small">
                        Last AI Analysis:{' '}
                        {evaluationData.updated_at ? new Date(evaluationData.updated_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-data-box text-center text-muted border rounded mt-4">
                    <p className="mb-0">
                      분석된 데이터가 없습니다. 상단의 'AI Re-evaluate' 버튼을 눌러 분석을 시작하세요.
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
