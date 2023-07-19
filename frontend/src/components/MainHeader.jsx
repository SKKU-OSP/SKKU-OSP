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
  const [isAuth] = useState(true);

  return (
    <header className="container d-flex flex-row flex-wrap align-items-center justify-content-between py-3">
      <div className={`col-lg-2 col-1 ${classes.logo}`}>
        <Link to="/community/" className="fs-3 bold text-nowrap align-middle">
          <img width="42px" height="42px" src="/images/logo-simple.svg" alt="로고" />
          <span className={classes.siteTitle}>SKKU SOSD</span>
        </Link>
      </div>
      <div className="col-lg-5 col-9">
        <ul className="nav flex-nowrap justify-content-end">
          <li className="nav-item">
            <Link to="/community" className="nav-link text-nowrap">
              커뮤니티
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/community/board/팀 모집" className="nav-link text-nowrap">
              팀 모집
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/community/team" className="nav-link text-nowrap">
              팀 게시판
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/community/challenge" className="nav-link text-nowrap">
              챌린지
            </Link>
          </li>
        </ul>
      </div>
      <div className={isAuth ? `${classes.search} col-lg-3 col-8 ms-2` : 'ms-2'}>
        <SearcherBox />
      </div>
      <div className="d-flex flex-row justify-content-end p-2">
        <IconList_Container />
      </div>
    </header>
  );
}

export default MainHeader;
