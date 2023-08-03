import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BsList } from 'react-icons/bs';

import SearchBox from './NavBar/SearchBox/SearchBox';
import IconList_Container from './NavBar/IconList_Container';

import './MainHeader.css';
/**
 * TARGET: header.html
 */
function MainHeader(props) {
  const [isToggled, setIsToggled] = useState(false);

  function onClickToggle() {
    if (isToggled) {
      setIsToggled(false);
    } else {
      setIsToggled(true);
    }
  }

  // TODO 유저 인증시 변경되는 설정 적용
  const [isAuth] = useState(true);

  return (
    <header>
      <div className="container d-flex py-3 header">
        <div className="head-of-header d-flex">
          <div className="col-lg-3 col-1 logo">
            <Link to="/" className="fs-3 bold text-nowrap align-middle" style={{ textDecoration: 'none' }}>
              <img width="42px" height="42px" src="/images/logo-simple.svg" alt="로고" />
              <span className="siteTitle">SKKU SOSD</span>
            </Link>
          </div>
          <div className="on-mobile p-2">
            <IconList_Container />
          </div>
          <button className="header-toggler" type="button" onClick={onClickToggle}>
            <BsList size="24" />
          </button>
        </div>

        <div className={isToggled ? 'body-of-header' : 'toggle-display-none body-of-header'}>
          <div className="header-navbar">
            <Link to="/community/자유" className="header-navbar-menu">
              커뮤니티
            </Link>
            <Link to="/community/" className="header-navbar-menu">
              팀 모집
            </Link>
            <Link to="/community/" className="header-navbar-menu">
              팀 게시판
            </Link>
            <Link to="/community/" className="header-navbar-menu">
              챌린지
            </Link>
          </div>
          <SearchBox />
          <div className="on-desktop p-2">
            <IconList_Container />
          </div>
        </div>
      </div>
    </header>
  );
}

export default MainHeader;
