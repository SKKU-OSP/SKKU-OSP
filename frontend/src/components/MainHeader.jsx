import { useState } from 'react';
import { Link } from 'react-router-dom';

import SearcherBox from './NavBar/SearchBox/SearchBox';
import IconList_Container from './NavBar/IconList_Container';

import './MainHeader.css';
/**
 * TARGET: header.html
 */
function MainHeader() {
  // TODO 유저 인증시 변경되는 설정 적용
  const [isAuth] = useState(true);

  return (
    <header>
      <div className="container d-flex flex-row py-3 position-relative header">
        <div className="col-lg-3 col-1 logo">
          <Link to="/" className="fs-3 bold text-nowrap align-middle" style={{ textDecoration: 'none' }}>
            <img width="42px" height="42px" src="/images/logo-simple.svg" alt="로고" />
            <span className="siteTitle">SKKU SOSD</span>
          </Link>
        </div>
        <div className="nav-bar">
          <Link to="/community/" className="nav-bar-menu">
            커뮤니티
          </Link>
          <Link to="/community/" className="nav-bar-menu">
            팀 모집
          </Link>
          <Link to="/community/" className="nav-bar-menu">
            팀 게시판
          </Link>
          <Link to="/community/" className="nav-bar-menu">
            챌린지
          </Link>
        </div>
        <SearcherBox />
        <div className="d-flex flex-row p-2">
          <IconList_Container />
        </div>
      </div>
    </header>
  );
}

export default MainHeader;
