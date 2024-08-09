import './SideBar.css';
import Button from 'react-bootstrap/Button';
import { BsGithub } from 'react-icons/bs';
import { Link } from 'react-router-dom';

export default function SideBar_Presenter(props) {
  const { name, username, githubUsername, photo, onMyProfile, onMyGithub, onLogin, sendLogoutRequest, location } =
    props;

  const handleClickManual = () => {
    window.open('https://equinox-rule-857.notion.site/SOSD-User-Manual-4283b4cc583e47298a42470a11be1c42');
  };

  return (
    <div className="col-lg-2 community-sidebar">
      {/* is_authenticated 확인 & 프로필 이미지 src 교체 필요 */}
      {username ? (
        <>
          <div id="sidebar-user-info">
            <div className="img-container">
              <img
                src={photo}
                className="sidebar-profile-img"
                alt="profile-image"
                data-bs-hover="tooltip"
                data-bs-placement="top"
                data-bs-title="프로필 페이지"
              ></img>
            </div>
            <div id="sidebar-profile-name" onClick={onMyProfile} className="d-flex align-items-center">
              {name}
            </div>
            <div id="sidebar-profile-username" onClick={onMyGithub}>
              <BsGithub />
              {githubUsername}
            </div>
            <Button type="button" className="btn btn-logout" onClick={onMyProfile}>
              내 프로필
            </Button>
          </div>
          <div className="sidebar-content">
            <Button type="button" className="btn btn-manual" onClick={handleClickManual}>
              사용자 가이드
            </Button>
            <div className="sidebar-logout" style={{ color: '#808080' }} onClick={sendLogoutRequest}>
              로그아웃
            </div>
          </div>
        </>
      ) : (
        <div id="sidebar-user-info">
          <div className="img-container">
            <img
              src="https://cdn.vectorstock.com/i/preview-1x/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg"
              className="sidebar-profile-img"
              alt="profile-image"
              data-bs-hover="tooltip"
              data-bs-placement="top"
              data-bs-title="프로필 페이지"
            ></img>
          </div>
          <button
            type="button"
            className="btn btn-third btn-login"
            onClick={onLogin}
            style={{ fontFamily: 'nanumfont_Bold', letterSpacing: '1px' }}
          >
            로그인
          </button>
          <button
            type="button"
            className="btn btn-fourth btn-signup"
            onClick={onLogin}
            style={{ fontFamily: 'nanumfont_Bold' }}
          >
            회원가입
          </button>
          <div className="sidebar-manual" style={{ color: '#072a60' }} onClick={handleClickManual}>
            사용자 가이드
          </div>
        </div>
      )}
    </div>
  );
}
