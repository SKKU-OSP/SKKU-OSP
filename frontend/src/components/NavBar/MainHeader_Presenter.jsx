import { Link } from 'react-router-dom';
import { BsList } from 'react-icons/bs';

import SearchBox from './SearchBox/SearchBox';
import IconList_Container from './IconList/IconList_Container';

import './MainHeader.css';
/**
 * TARGET: header.html
 */
function MainHeader_Presenter(props) {
  const { username, isToggled, onClickToggle, onLogin } = props;

  return (
    <header>
      <div className="container d-flex py-3 position-relative header">
        <div className="head-of-header d-flex">
          <div className="col-lg-3 col-1 logo">
            <Link to="/" className="fs-3 bold text-nowrap align-middle" style={{ textDecoration: 'none' }}>
              <img width="42px" height="42px" src="/images/logo-simple.svg" alt="로고" />
              <span className="siteTitle">SKKU SOSD</span>
            </Link>
          </div>
          {username ? (
            <div className="on-mobile p-2">
              <IconList_Container />
            </div>
          ) : (
            <button type="button" className="btn-login on-mobile" onClick={onLogin}>
              로그인
            </button>
          )}
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
          {username && (
            <div className="on-desktop p-2">
              <IconList_Container />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default MainHeader_Presenter;
