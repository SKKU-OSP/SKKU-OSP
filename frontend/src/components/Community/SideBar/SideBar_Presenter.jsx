import './SideBar.css';
import Button from 'react-bootstrap/Button'
import { BsGithub } from 'react-icons/bs';
import { Link } from 'react-router-dom';

export default function SideBar_Presenter(props) {
  const { name, username, githubUsername, photo, onMyProfile, onMyGithub, onLogin, sendLogoutRequest, location } =
    props;

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
              프로필 편집
            </Button>
          </div>
          <div className="sidebar-content">
            <Link to="/community/activity/article">
              <div
                className={location == '/community/activity/article' ? 'sidebar-selected-activity' : 'sidebar-activity'}
              >
                내가 작성한 글
              </div>
            </Link>

            <Link to="/community/activity/comment">
              <div
                className={location == '/community/activity/comment' ? 'sidebar-selected-activity' : 'sidebar-activity'}
              >
                내가 작성한 댓글
              </div>
            </Link>
            <Link to="/community/activity/scrap">
              <div
                className={location == '/community/activity/scrap' ? 'sidebar-selected-activity' : 'sidebar-activity'}
              >
                내가 스크랩한 글
              </div>
            </Link>
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
          <button type="button" className="btn btn-third btn-login" onClick={onLogin} style={{ fontFamily: "nanumfont_Bold", letterSpacing: "1px"}}>
            로그인
          </button>
          {/* <button type="button" className="btn btn-fourth btn-signup" onClick={onLogin}>
            회원가입
          </button> */}
        </div>
      )}
    </div>
  );
}
