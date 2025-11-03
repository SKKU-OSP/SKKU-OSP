import React, { useState } from "react";

// 아이콘 대신 임시 텍스트 사용 (추후 react-icons 등으로 대체)
const StarIcon = () => "⭐";
const ForkIcon = () => "🍴";
const PRIcon = () => "PR";
const IssueIcon = () => "⚠️";
const WatcherIcon = () => "👀";
const ContributorIcon = () => "👥";
const CaretDownIcon = () => "▼";
const CaretUpIcon = () => "▲";

function RepoCard({ repo }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="repo-card">
      <div
        className="repo-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="repo-header-info">
          <h3>{repo.name}</h3>
          <p>{repo.description}</p>
        </div>
        <button className="expand-button">
          {isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
        </button>
      </div>

      {isExpanded && (
        <div className="repo-card-body">
          <div className="repo-stats-badges">
            <span className="badge"><StarIcon /> {repo.stars}</span>
            <span className="badge"><ForkIcon /> {repo.forks}</span>
            <span className="badge"><PRIcon /> {repo.pullRequests}</span>
            <span className="badge"><IssueIcon /> {repo.issues}</span>
          </div>

          <div className="repo-details-grid">
            <div className="detail-item">
              <span className="detail-title"><WatcherIcon /> Watchers</span>
              <span className="detail-value">{repo.watchers}</span>
            </div>
            <div className="detail-item">
              <span className="detail-title"><ContributorIcon /> 기여자</span>
              <span className="detail-value">{repo.contributors}</span>
            </div>
            <div className="detail-item">
              <span className="detail-title">생성</span>
              <span className="detail-value">{new Date(repo.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-title">업데이트</span>
              <span className="detail-value">{new Date(repo.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="language-tags">
            <span className="detail-title">사용 언어</span>
            <div className="tags-list">
              {repo.languages.map((lang) => (
                <span key={lang} className="tag">{lang}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepoCard;