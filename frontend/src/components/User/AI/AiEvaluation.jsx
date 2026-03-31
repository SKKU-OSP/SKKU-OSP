import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BsStar, BsBook, BsChatLeftDots, BsArrowRightShort } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../utils/auth';
import '../User.css';

const server_url = import.meta.env.VITE_SERVER_URL;

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
        console.error("Failed to fetch repo list:", error);
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

  const evaluateReadme = async (repoName, readmeContent) => {
    setEvaluationLoading(true);
    try {
      const url = '/user/api/ai-evaluation/';
      const response = await axiosInstance.post(url, {
        repo_name: repoName,
        readme_content: readmeContent
      }, {
        ...getAuthConfig(),
        timeout: 60000 // AI 분석을 위해 타임아웃을 60초로 연장
      });
      
      if (response.data.status === 'success') {
        setEvaluationData(response.data.data);
      } else {
        alert("AI 평가 중 오류가 발생했습니다: " + response.data.message);
      }
    } catch (error) {
      console.error("AI Evaluation failed:", error);
      alert("AI 평가 요청에 실패했습니다.");
    } finally {
      setEvaluationLoading(false);
    }
  };

  const handleRepoClick = async (repo) => {
    setSelectedRepo(repo);
    setReadmeLoading(true);
    setEvaluationData(null); // 새로운 레포 선택 시 이전 평가 결과 초기화
    try {
      // GitHub API를 통해 README 내용 가져오기
      const response = await axios.get(`https://api.github.com/repos/${repo.owner_id}/${repo.repo_name}/readme`);
      if (response.data && response.data.content) {
        const decodedContent = b64DecodeUnicode(response.data.content);
        setSelectedRepo(prev => ({ ...prev, readme_content: decodedContent }));
        // README를 성공적으로 가져오면 AI 평가 실행
        evaluateReadme(repo.repo_name, decodedContent);
      }
    } catch (error) {
      console.error("Failed to fetch README:", error);
      setSelectedRepo(prev => ({ ...prev, readme_content: "README를 불러올 수 없습니다. (Public 레포지토리만 지원하거나 파일이 없을 수 있습니다.)" }));
    } finally {
      setReadmeLoading(false);
    }
  };

  // Base64 디코딩 (Unicode 지원)
  const b64DecodeUnicode = (str) => {
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  if (loading) return <div className="text-center" style={{ marginTop: '100px' }}><LoaderIcon /></div>;
  if (errorOccur) return <div className="text-center mt-5">데이터를 불러오는 중 오류가 발생했습니다.</div>;

  return (
    <div className="container mb-4 mt-4">
      <div className="community-nav d-flex mb-4" style={{ marginLeft: '10px' }}>
        <div className="nav nav-fill">
          <li className="nav-item selected-nav-item">
            <div>AI README Evaluation</div>
          </li>
        </div>
      </div>

      <div className="row">
        {/* 왼쪽: 레포지토리 목록 */}
        <div className="col-md-5">
          <h5 className="mb-3 ml-2 font-weight-bold" style={{ color: '#444' }}>Repositories</h5>
          <div className="repo-list-container" style={{ maxHeight: '700px', overflowY: 'auto', paddingRight: '5px' }}>
            {repos.length > 0 ? (
              repos.map((repo, index) => (
                <div 
                  className={`card mb-3 shadow-sm ${selectedRepo?.repo_name === repo.repo_name ? 'border-primary' : ''}`} 
                  key={index}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    transform: selectedRepo?.repo_name === repo.repo_name ? 'scale(1.02)' : 'none',
                    backgroundColor: selectedRepo?.repo_name === repo.repo_name ? '#f8fbff' : '#fff'
                  }}
                  onClick={() => handleRepoClick(repo)}
                >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="card-title mb-1 font-weight-bold" style={{ color: '#007bff' }}>{repo.repo_name}</h6>
                        <small className="text-muted d-block mb-2">Created by {repo.owner_id}</small>
                      </div>
                      <span className="badge badge-light" style={{ fontSize: '0.85rem' }}><BsStar className="mr-1" /> {repo.star_count}</span>
                    </div>
                    <p className="small text-muted mb-2" style={{ 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden' 
                    }}>
                      {repo.proj_short_desc || '설명이 없습니다.'}
                    </p>
                    <div className="text-right">
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
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

        {/* 오른쪽: README 미리보기 및 AI 피드백 */}
        <div className="col-md-7">
          {selectedRepo ? (
            <div className="card shadow-sm h-100" style={{ borderTop: '4px solid #007bff' }}>
              <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <span className="font-weight-bold" style={{ fontSize: '1.1rem' }}>
                  <BsBook className="mr-2 text-primary" /> {selectedRepo.repo_name} / README.md
                </span>
                <button 
                  className="btn btn-sm btn-primary px-3 shadow-sm"
                  onClick={() => evaluateReadme(selectedRepo.repo_name, selectedRepo.readme_content)}
                  disabled={evaluationLoading || !selectedRepo.readme_content}
                >
                  {evaluationLoading ? 'Evaluating...' : 'AI Re-evaluate'}
                </button>
              </div>
              <div className="card-body overflow-auto" style={{ maxHeight: '650px' }}>
                <div className="readme-header mb-2 small text-muted font-italic">Preview Content:</div>
                <div className="readme-preview p-3 bg-light rounded mb-4" style={{ border: '1px solid #eee', minHeight: '100px' }}>
                  {readmeLoading ? (
                    <div className="text-center py-5"><LoaderIcon /></div>
                  ) : (
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.9rem', 
                      fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                      color: '#333'
                    }}>
                      {selectedRepo.readme_content || "# README 데이터가 아직 연동되지 않았습니다."}
                    </pre>
                  )}
                </div>
                
                <hr className="my-4" />
                
                <h6 className="mt-4 font-weight-bold"><BsChatLeftDots className="mr-2 text-info" /> AI Analysis Feedback</h6>
                {evaluationLoading ? (
                  <div className="text-center py-4">
                    <LoaderIcon />
                    <p className="mt-2 text-muted">AI가 분석 중입니다...</p>
                  </div>
                ) : evaluationData ? (
                  <div className="p-3 border rounded border-info mt-3" style={{ backgroundColor: '#f0faff' }}>
                    <div className="feedback-item mb-3">
                      <span className="badge badge-success mb-2">Strengths</span>
                      <ul className="small mb-1 text-dark" style={{ lineHeight: '1.5', paddingLeft: '20px' }}>
                        {evaluationData.strengths?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="feedback-item mb-3">
                      <span className="badge badge-warning mb-2">Improvements</span>
                      <ul className="small mb-1 text-dark" style={{ lineHeight: '1.5', paddingLeft: '20px' }}>
                        {evaluationData.improvements?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Evaluation Date: {new Date().toLocaleDateString()}</span>
                      <div className="text-right">
                        <span className="mr-2 text-muted">Overall Grade</span>
                        <span className="h4 text-primary font-weight-bold mb-0">
                          {evaluationData.grade} ({evaluationData.score})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted border rounded bg-light">
                    리포지토리를 선택하면 AI 평가 결과가 여기에 표시됩니다.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card shadow-sm h-100 d-flex flex-column align-items-center justify-content-center text-muted p-5 bg-light" style={{ borderStyle: 'dashed', borderWidth: '2px' }}>
              <BsArrowRightShort size={60} className="mb-3" style={{ opacity: 0.3 }} />
              <h5>Select a Repository</h5>
              <p className="text-center">왼쪽 목록에서 분석하고 싶은 리포지토리를 선택하면<br/>AI가 README를 평가해 드립니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiEvaluation;
