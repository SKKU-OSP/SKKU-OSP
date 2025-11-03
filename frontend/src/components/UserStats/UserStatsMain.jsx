import React, { useState, useEffect } from "react";
import StudentList from "./StudentList";
import StudentDetails from "./StudentDetails";
import "./UserStats.css";

function UserStatsMain() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedYear, setSelectedYear] = useState("2025");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/userstats");
        const data = await response.json();
        setStudents(data);
        if (data.length > 0) {
          setSelectedStudent(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="page-container">
      <div className="user-stats-layout">
        {/* 좌측 학생 리스트 */}
        <div className="student-list-container">
          <StudentList
            students={students}
            selectedStudent={selectedStudent}
            onSelectStudent={setSelectedStudent}
            loading={loading}
            selectedYear={selectedYear}
          />
        </div>

        {/* 우측 상세 정보 */}
        <div className="student-details-container">
          {/* 모바일 학생 선택 헤더 */}
          <div className="mobile-student-select">
            <select
              value={selectedStudent?.id || ""}
              onChange={(e) => {
                const student = students.find((s) => s.id === e.target.value);
                if (student) setSelectedStudent(student);
              }}
              className="mobile-select-dropdown"
            >
              <option value="">학생을 선택하세요</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.username} ({student.student_id})
                </option>
              ))}
            </select>
          </div>

          {/* 상세 정보 영역 */}
          <div className="details-content-area">
            {loading ? (
              <div className="loading-container"><p>데이터를 불러오는 중입니다...</p></div>
            ) : selectedStudent ? (
              <StudentDetails
                student={selectedStudent}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            ) : (
              <div className="loading-container">
                <p>학생을 선택해주세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserStatsMain;