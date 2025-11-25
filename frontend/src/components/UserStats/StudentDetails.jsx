import React from 'react';
import { BsPlus, BsDash } from 'react-icons/bs';
import RepoList from './RepoList';
import { BsGithub } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

// 통계 카드 컴포넌트
const StatCard = ({ title, value, color, addLines, delLines }) => (
  <div className="stat-card" style={{ borderLeftColor: color }}>
    <span className="stat-title">{title}</span>
    <div className="stat-value-wrapper">
      <span className="stat-value">{value.toLocaleString()}</span>
      {addLines !== undefined && delLines !== undefined && (
        <span className="stat-commit-lines">
          <span className="add-lines">
            <BsPlus />
            {addLines.toLocaleString()}
          </span>
          <span className="del-lines">
            <BsDash />
            {delLines.toLocaleString()}
          </span>
        </span>
      )}
    </div>
  </div>
);

function StudentDetails({ student, selectedYear, onYearChange }) {
  const navigate = useNavigate();

  if (!student) {
    return null;
  }

  // 선택된 연도의 통계 (없을 경우 기본값)
  const stats = student.yearlyStats[selectedYear] || {
    github_score: 0,
    commit_cnt: 0,
    add_line: 0,
    del_line: 0,
    pr_cnt: 0,
    issue_cnt: 0
  };

  // 학생 데이터에서 가능한 연도 목록 추출 (내림차순 정렬)
  const availableYears = Object.keys(student.yearlyStats).sort().reverse();

  const onGithub = () => {
    window.open(`https://www.github.com/${student.github_id}`, '_blank', 'noopener,noreferrer');
  };

  const onProfile = () => {
    navigate(`/user/${student.username}`);
  };

  return (
    <div className="student-details">
      <div className="details-header">
        <div className="header-info">
          <h1 onClick={onProfile} className="student-name-click">
            {student.name}
          </h1>
          <span className="student-id-badge">{student.student_id}</span>
          <p onClick={onGithub} className="student-github-click">
            <BsGithub /> {student.github_id}
          </p>
        </div>
        <div className="year-selector">
          <label htmlFor="year-select">연도 선택</label>
          <select id="year-select" value={selectedYear} onChange={(e) => onYearChange(e.target.value)}>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="총 점수" value={stats.github_score.toFixed(2)} color="#3498db" />
        <StatCard title="Commits" value={stats.commit_cnt} color="#2ecc71" />
        <StatCard
          title="Commit Lines"
          value={stats.add_line + stats.del_line}
          color="#9b59b6"
          addLines={stats.add_line}
          delLines={stats.del_line}
        />
        <StatCard title="Pull Requests" value={stats.pr_cnt} color="#f39c12" />
        <StatCard title="Issues" value={stats.issue_cnt} color="#e74c3c" />
      </div>

      <RepoList repositories={student.repositories} />
    </div>
  );
}

export default StudentDetails;
