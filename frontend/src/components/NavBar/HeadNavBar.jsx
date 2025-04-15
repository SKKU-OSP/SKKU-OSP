import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function HeaderNavBar() {
  const location = useLocation().pathname.split('/')[2];
  return (
    <div className="header-navbar">
      <Link
        to="/community/board/홍보"
        className={location == 'board' ? 'header-navbar-selected-menu' : 'header-navbar-menu'}
      >
        커뮤니티
      </Link>
      <Link
        to="/community/recruit/팀 모집"
        className={location == 'recruit' ? 'header-navbar-selected-menu' : 'header-navbar-menu'}
      >
        팀 모집
      </Link>
      <Link to="/community/team" className={location == 'team' ? 'header-navbar-selected-menu' : 'header-navbar-menu'}>
        팀 게시판
      </Link>
      <Link
        to="/community/challenge"
        className={location == 'challenge' ? 'header-navbar-selected-menu' : 'header-navbar-menu'}
      >
        챌린지
      </Link>
    </div>
  );
}

export default HeaderNavBar;
