import '../../User.css';
import { BsStar, BsCheck2, BsArrow90DegLeft } from 'react-icons/bs';
function Activity() {
  return (
    <div className="profile-activity">
      <div className="d-flex flex-column justify-content-start profile-portfolio">
        <div className="d-flex flex-row justify-content-between portfolio-intro">
          <span className="intro">포트폴리오</span>
          <button className="btn">
            <span className="btn-text">수정</span>
          </button>
        </div>
        <div className="portfolio-text">
          <span className="text">
            ### [2021.06.07 ~ 2021.12.10] 산학협력프로젝트 - 아르스프락시아 Scrapy 크롤러 개발 및 모니터링 시스템 개발
          </span>
        </div>
      </div>
      <div className="d-flex flex-column justify-content-start profile-contribution">
        <div className="d-flex flex-row justify-content-between contribution-intro">
          <span className="intro">최근 기여활동</span>
          <a href="" className="href">
            자세히 알아보기 &gt;
          </a>
        </div>
        <div className="contribution-repo ">
          <div className="d-flex flex-column justify-content-start repo">
            <div className="d-flex flex-row justify-content-between title">
              <span className="title-text">SKKU-OSP</span>
              <span className="commit-date">
                최근 커밋일자
                <br />
                2023-06-17
              </span>
            </div>
            <div className="d-flex flex-row justify-content-start gap-1 stat">
              <BsStar size={16} />
              <span className="stat-text">Stars 0</span>
              <BsCheck2 size={16} />
              <span className="stat-text">Commits 31</span>
              <BsArrow90DegLeft size={16} />
              <span className="stat-text">Pull Requests 0</span>
            </div>
            <span className="desc">성균관대 오픈소스 플랫폼 SOSD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Activity;
