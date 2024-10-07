import { Link } from 'react-router-dom';

import './MainFooter.css';
/**
 * TARGET: header.html
 */
function MainHeader_Presenter() {
  return (
    <footer className="footer">
      <div className="container d-flex justify-content-between align-items-center">
        <div>
          <Link className="logo">
            <img height="30px" src="/images/skku_logo.png" alt="SKKU 로고" />
          </Link>
        </div>
        <ul className="footer-link">
          <li>
            <a
              href="https://www.skku.edu/skku/etc/private.do"
              target="_blank"
              title="개인정보처리방침 바로가기"
              style={{ color: '#8dc63f' }}
            >
              개인정보처리방침
            </a>
          </li>
          <li>
            <a
              href="https://www.skku.edu/skku/etc/netizen.do"
              target="_blank"
              title="네티즌윤리규약 바로가기"
              style={{ color: '#bfbfbf' }}
            >
              네티즌윤리규약
            </a>
          </li>
          <li>
            <a
              href="https://www.skku.edu/skku/etc/pop_email.do"
              target="_blank"
              title="이메일무단수집거부 바로가기"
              style={{ color: '#bfbfbf' }}
            >
              이메일무단수집거부
            </a>
          </li>
        </ul>
      </div>
      {/* <a class="scroll-top-btn" href="#" title="상단으로 이동" style={{ display: 'block' }}>
        <img alt="top" src="/_res/temp/img/common/btn_scroll_top_green.gif" />
      </a> */}
    </footer>
  );
}

export default MainHeader_Presenter;
