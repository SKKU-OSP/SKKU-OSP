import React, { useState } from 'react';
import { BsArrowClockwise } from 'react-icons/bs';
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
  BsKey,
  BsPlus,
  BsDash
} from 'react-icons/bs';
import { GoCommit } from 'react-icons/go';
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
                <span className="title-name">
                  <GoCommit /> Commits
                </span>
                <span>( 유저 / 전체 )</span>
              </span>
              <span className="detail-value">
                <span className="detail-user-value">{repo.user_commits}</span>
                <span className="detail-total-value">
                  {' / '}
                  {repo.commits}
                </span>
                <span className="detail-percentage">
                  {' ( '}
                  {((repo.user_commits / repo.commits) * 100).toFixed(2)} {'% )'}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-title">
                <span className="title-name">
                  <BsCheckLg /> Commit Lines
                </span>
                <span>( 유저 / 전체 )</span>
              </span>
              <span className="detail-value">
                <span className="detail-user-value">{repo.user_add_lines + repo.user_del_lines}</span>
                <span className="detail-total-value">
                  {' / '}
                  {repo.add_lines + repo.del_lines}
                </span>
                <span className="detail-percentage">
                  {' ( '}
                  {(((repo.user_add_lines + repo.user_del_lines) / (repo.add_lines + repo.del_lines)) * 100).toFixed(
                    2
                  )}{' '}
                  {'% )'}
                </span>
                <span className="repo-commit-lines">
                  <span className="add-lines">
                    <BsPlus />
                    {repo.user_add_lines}
                  </span>
                  <span className="del-lines">
                    <BsDash />
                    {repo.user_del_lines}
                  </span>
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-title">
                <span className="title-name">
                  <PiGitPullRequestBold /> Pull Requests
                </span>
                <span>( 유저 / 전체 )</span>
              </span>
              <span className="detail-value">
                <span className="detail-user-value">{repo.user_PRs}</span>
                <span className="detail-total-value">
                  {' / '}
                  {repo.pullRequests}
                </span>
                <span className="detail-percentage">
                  {' ( '}
                  {((repo.user_PRs / repo.pullRequests) * 100).toFixed(2)} {'% )'}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-title">
                <span className="title-name">
                  <BsRecordCircle /> Issues
                </span>
                <span>( 유저 / 전체 )</span>
              </span>
              <span className="detail-value">
                <span className="detail-user-value">{repo.user_issues}</span>
                <span className="detail-total-value">
                  {' / '}
                  {repo.issues}
                </span>
                <span className="detail-percentage">
                  {' ( '}
                  {((repo.user_issues / repo.issues) * 100).toFixed(2)} {'% )'}
                </span>
              </span>
            </div>
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

          <div className="repo-refresh">
            <button className="refresh-button">
              <BsArrowClockwise />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepoCard;
