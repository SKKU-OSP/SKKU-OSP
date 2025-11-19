import React, { useState } from 'react';

import {
  BsStar,
  BsEye,
  BsCheckLg,
  BsCheckCircle,
  BsRecordCircle,
  BsPeople,
  BsBox,
  BsCardHeading,
  BsBook,
  BsKey
} from 'react-icons/bs';
import { PiGitForkBold, PiGitPullRequestBold } from 'react-icons/pi';

function RepoCard({ repo }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="repo-card">
      <div className="repo-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="repo-header-info">
          <h3>{repo.name}</h3>
          <p>{repo.description}</p>
          <div className="repo-stats-inline">
            <span className="repo-stat-item" title="Stars">
              <span className="stat-icon">
                <BsStar />
              </span>{' '}
              {repo.stars}
            </span>
            <span className="repo-stat-item" title="Forks">
              <span className="stat-icon">
                <PiGitForkBold />
              </span>{' '}
              {repo.forks}
            </span>
            <span className="repo-stat-item" title="Watchers">
              <span className="stat-icon">
                <BsEye />
              </span>{' '}
              {repo.watchers}
            </span>
            <span className="repo-stat-item" title="Contributors">
              <span className="stat-icon">
                <BsPeople />
              </span>{' '}
              {repo.contributors}
            </span>
          </div>
        </div>
        <button className="expand-button">{isExpanded ? '▲' : '▼'}</button>
      </div>

      {isExpanded && (
        <div className="repo-card-body">
          <div className="repo-details-grid">
            <div className="detail-item">
              <span className="detail-title">
                <BsCheckLg /> 커밋 수
              </span>
              <span className="detail-value">{repo.commits}</span>
            </div>
            <div className="detail-item">
              <span className="detail-title">
                <BsCheckLg /> 커밋 수
              </span>
              <span className="detail-value">{repo.commits}</span>
            </div>
            <div className="detail-item">
              <span className="detail-title">
                <PiGitPullRequestBold /> PR 수
              </span>
              <span className="detail-value">{repo.pullRequests}</span>
            </div>
            <div className="detail-item">
              <span className="detail-title">
                <BsRecordCircle /> Issue 수
              </span>
              <span className="detail-value">{repo.issues}</span>
            </div>
            {/* <div className="detail-item">
              <span className="detail-title">📅 생성 날짜</span>
              <span className="detail-value">{new Date(repo.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-title">🔄 최근 업데이트</span>
              <span className="detail-value">{new Date(repo.updatedAt).toLocaleDateString()}</span>
            </div> */}
            {/* <span className="repo-stat-item" title="Commits">
              <span className="stat-icon">
                <BsCheckLg />
              </span>{' '}
              {repo.commits}
            </span> */}
            {/* <span className="repo-stat-item" title="Pull Requests">
              <span className="stat-icon">
                <PiGitPullRequestBold />
              </span>{' '}
              {repo.pullRequests}
            </span>
            <span className="repo-stat-item" title="Issues">
              <span className="stat-icon">
                <BsRecordCircle />
              </span>{' '}
              {repo.issues}
            </span> */}
          </div>

          <div className="repo-optional">
            <div className="language-tags">
              <span className="detail-title">사용 언어</span>
              <div className="tags-list">
                {repo.languages.map((lang) => (
                  <span key={lang} className="tag">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="repo-dates">
              <div className="date-item">
                <span className="date-title">📅 생성 날짜</span>
                <span className="date-value">{new Date(repo.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="date-item">
                <span className="date-title">🔄 최근 업데이트</span>
                <span className="date-value">{new Date(repo.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepoCard;
