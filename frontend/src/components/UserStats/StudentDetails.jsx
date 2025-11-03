import React from "react";
import RepoList from "./RepoList";
import { BsGithub } from 'react-icons/bs';

// 통계 카드 컴포넌트
const StatCard = ({ title, value, color }) => (
  <div className="stat-card" style={{ borderLeftColor: color }}>
    <span className="stat-title">{title}</span>
    <span className="stat-value">{value.toLocaleString()}</span>
  </div>
);

function StudentDetails({ student, selectedYear, onYearChange }) {
  if (!student) {
    return null; // Main 컴포넌트에서 이미 로딩/선택 처리를 하지만, 안전장치
  }

  // 선택된 연도의 통계 (없을 경우 기본값)
  const stats = student.yearlyStats[selectedYear] || {
    github_score: 0,
    commit_cnt: 0,
    commit_line: 0,
    pr_cnt: 0,
    issue_cnt: 0,
  };

  // 학생 데이터에서 가능한 연도 목록 추출 (내림차순 정렬)
  const availableYears = Object.keys(student.yearlyStats).sort().reverse();

  return (
    <div className="student-details">
      <div className="details-header">
        <div className="header-info">
          <h1>{student.username}</h1>
          <span className="student-id-badge">{student.student_id}</span>
          <p className="student-github-link"><BsGithub /> {student.github_id}</p>
        </div>
        <div className="year-selector">
          <label htmlFor="year-select">연도 선택</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="총 점수" value={stats.github_score.toFixed(1)} color="#3498db" />
        <StatCard title="커밋" value={stats.commit_cnt} color="#2ecc71" />
        <StatCard title="커밋 라인" value={stats.commit_line} color="#9b59b6" />
        <StatCard title="PR" value={stats.pr_cnt} color="#f39c12" />
        <StatCard title="Issues" value={stats.issue_cnt} color="#e74c3c" />
      </div>

      <RepoList repositories={student.repositories} />
    </div>
  );
}

export default StudentDetails;