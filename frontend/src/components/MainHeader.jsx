import { useState } from 'react';
import { Link } from 'react-router-dom';

import SearcherBox from './SearchBox';
import classes from './MainHeader.module.css';
import IconList_Container from './NavBar/IconList_Container';

import './MainHeader.css';
/**
 * TARGET: header.html
 */
function MainHeader() {
  // TODO 유저 인증시 변경되는 설정 적용
  const [isAuth] = useState(true);

  return (
    <header className="container d-flex flex-row py-3 position-relative">
      <div className={`col-lg-3 col-1 ${classes.logo}`}>
        <Link to="/community/" className="fs-3 bold text-nowrap align-middle">
          <img width="42px" height="42px" src="/images/logo-simple.svg" alt="로고" />
          <span className={classes.siteTitle}>SKKU SOSD</span>
        </Link>
      </div>
      <div className={isAuth ? `${classes.search} ms-2` : 'ms-2'}>
        <SearcherBox />
      </div>
      <div className="d-flex flex-row p-2">
        <IconList_Container />
      </div>
    </header>
  );
}

export default MainHeader;
