import { Link } from 'react-router-dom';

import { BsList } from 'react-icons/bs';

import HeaderNavBar from './HeadNavBar';
import SearchBox from './SearchBox/SearchBox';
import IconList_Container from './IconList/IconList_Container';

import './MainHeader.css';
/**
 * TARGET: header.html
 */
function MainHeader_Presenter(props) {
  const { username, isToggled, onClickToggle, onLogin } = props;

  return (
    <header className={isToggled ? 'extended' : ''}>
      <div className="container d-flex position-relative header">
        <div className="head-of-header d-flex w-100">
          <Link className="logo">
            <img className="invert-color" width="42px" height="42px" src="/images/logo-simple.svg" alt="로고" />
            <div className="siteTitle fs-3">SKKU SOSD</div>
          </Link>
          <div className="col-lg-9 col-11 d-flex justify-content-end">
            <div className="on-desktop justify-content-between flex-grow-1 gap-3">
              <HeaderNavBar />
              <SearchBox />
            </div>
            <div className="d-flex gap-2">
              {username ? (
                <div className="d-flex p-2">
                  <IconList_Container username={username} />
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
          </div>
        </div>
        <div className={isToggled ? 'on-mobile body-of-header' : 'on-mobile toggle-display-none body-of-header'}>
          <HeaderNavBar />
          <SearchBox />
        </div>
      </div>
    </header>
  );
}

export default MainHeader_Presenter;
