import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../../utils/auth-context';

function HeaderNavBar() {
  const location = useLocation().pathname.split('/')[2];
  const navigate = useNavigate();
  const { username } = useContext(AuthContext);

  const handleDashboardClick = () => {
    if (username) {
      navigate('/new-dashboard');
    } else {
      if (confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      }
    }
  };

  return (
    <div className="header-navbar">
      <Link
        to="/community/board/홍보"
        className={location == 'board' ? 'header-navbar-selected-menu' : 'header-navbar-menu'}
      >
        커뮤니티
      </Link>
      <div
        onClick={handleDashboardClick}
        className={location == 'new-dashboard' ? 'header-navbar-selected-menu' : 'header-navbar-menu'}
        style={{ cursor: 'pointer' }}
      >
        대시보드
      </div>
      <Link
        to="/inquiry"
        className={location == 'inquiry' ? 'header-navbar-selected-menu' : 'header-navbar-menu'}
      >
        고객센터
      </Link>
    </div>
  );
}

export default HeaderNavBar;
