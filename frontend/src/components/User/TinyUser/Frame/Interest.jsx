import { useState } from 'react';
import '../../User.css';
import { BsFillStarFill } from 'react-icons/bs';
function Interest() {
  return (
    <div className="d-flex flex-column profile-interest">
      <div className="d-flex flex-column profile-category">
        <div className="d-flex flex-row justify-content-between category-intro">
          <span className="intro">관심분야</span>
          <button className="btn">
            <span className="btn-text">수정</span>
          </button>
        </div>
        <div className="d-flex flex-row category-icon">
          <div className="icon">
            <span className="icon-text">컨테이너</span>
          </div>
          <div className="icon">
            <span className="icon-text">CI/CD</span>
          </div>
          <div className="icon">
            <span className="icon-text">UI</span>
          </div>
        </div>
      </div>
      <div className="d-flex flex-column profile-language">
        <div className="d-flex flex-row justify-content-between language-intro">
          <span className="intro">사용언어/기술스택</span>
          <button className="btn">
            <span className="btn-text">수정</span>
          </button>
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '14px' }} />
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '26px' }} />
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '38px' }} />
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '50px' }} />
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '62px' }} />
          </div>
          <div className="language">
            <span className="language-text">Django</span>
          </div>
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '20px' }} />
            <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '32px' }} />
            <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '44px' }} />
            <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '56px' }} />
          </div>
          <div className="language">
            <span className="language-text">Django</span>
          </div>
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#0081DF" style={{ position: 'absolute', left: '26px' }} />
            <BsFillStarFill size={24} color="#0081DF" style={{ position: 'absolute', left: '38px' }} />
            <BsFillStarFill size={24} color="#0081DF" style={{ position: 'absolute', left: '50px' }} />
          </div>
          <div className="language">
            <span className="language-text">Django</span>
          </div>
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#51B5FF" style={{ position: 'absolute', left: '32px' }} />
            <BsFillStarFill size={24} color="#51B5FF" style={{ position: 'absolute', left: '44px' }} />
          </div>
          <div className="language">
            <span className="language-text">Django</span>
          </div>
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#B5DFFF" />
          </div>
          <div className="language">
            <span className="language-text">Django</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Interest;
