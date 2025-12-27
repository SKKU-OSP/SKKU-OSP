import React, { useState, useMemo } from 'react';
import { BsGithub, BsSearch } from 'react-icons/bs';

function StudentList({ students, selectedStudent, onSelectStudent, loading, selectedYear }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' 또는 'score'

  const getScore = (student) => {
    return student.yearlyStats[selectedYear]?.github_score || 0;
  };

  const filteredAndSortedStudents = useMemo(() => {
    return students
      .filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.github_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.student_id.toString().includes(searchTerm) // 이름, GitHub ID, 학번으로 검색 가능
      )
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.username.localeCompare(b.username);
        } else {
          return getScore(b) - getScore(a);
        }
      });
  }, [students, searchTerm, sortBy, selectedYear]);

  return (
    <div className="student-list-wrapper">
      <div className="student-list-header">
        <h2>유저 목록</h2>
        <span>{filteredAndSortedStudents.length}명의 유저</span>
      </div>

      {/* 검색 */}
      <div className="student-search">
        <span className="icon">
          <BsSearch />
        </span>
        <input
          type="text"
          placeholder="유저 검색 (이름, GitHub ID, 학번)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 정렬 버튼 */}
      <div className="sort-buttons">
        <button className={`sort-button ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')}>
          이름순
        </button>
        <button className={`sort-button ${sortBy === 'score' ? 'active' : ''}`} onClick={() => setSortBy('score')}>
          점수순
        </button>
      </div>

      {/* 유저 목록 */}
      <div className="student-list">
        {loading ? (
          <p>로딩 중...</p>
        ) : (
          filteredAndSortedStudents.map((student) => {
            const score = getScore(student);
            return (
              <div
                key={student.id}
                className={`student-item ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                onClick={() => onSelectStudent(student)}
              >
                <div className="student-item-left">
                  <div className="student-name">{student.name}</div>
                  <div className="student-github">
                    <span className="github-icon">
                      <BsGithub />
                    </span>{' '}
                    {student.github_id}
                  </div>
                </div>
                <div className="student-item-right">
                  <div className="student-id">{student.student_id}</div>
                  <div className="student-score">{score.toFixed(2)}점</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default StudentList;
