import './SideBar.css';
import { BsGithub } from 'react-icons/bs';
import { Link } from 'react-router-dom';

export default function SideBar_Presenter(props) {
  const { name, username, githubUsername, photo, onMyProfile, onMyGithub, onLogin, onSignUp, sendLogoutRequest } =
    props;

  return (
    <div className="col-3">
      <div className="community-sidebar">
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
              <div id="sidebar-profile-name" onClick={onMyProfile}>
                {name}
              </div>
              <div id="sidebar-profile-username" onClick={onMyGithub}>
                <BsGithub />
                {githubUsername}
              </div>
              <button type="button" className="btn btn-outline-secondary btn-logout" onClick={sendLogoutRequest}>
                로그아웃
              </button>
            </div>
            <div className="sidebar-content">
              <div className="sidebar-activity hover-opacity">
                <Link to="/community/activity/article">내가 작성한 글</Link>
              </div>
              <div className="sidebar-activity hover-opacity">
                <Link to="/community/activity/comment">내가 작성한 댓글</Link>
              </div>
              <div className="sidebar-activity hover-opacity">
                <Link to="/community/activity/scrap">내가 스크랩한 글</Link>
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
            <button type="button" className="btn btn-outline-secondary btn-login" onClick={onLogin}>
              로그인
            </button>
            <button type="button" className="btn btn-outline-primary btn-signup" onClick={onLogin}>
              회원가입
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
