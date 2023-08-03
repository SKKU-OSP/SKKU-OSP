import './SideBar.css';
import { BsGithub } from 'react-icons/bs';

export default function SideBar_Presenter(props) {
  const { name, username, githubUsername, onMyProfile, onMyGithub, onLogin } = props;

  return (
    <div>
      {/* is_authenticated 확인 & 프로필 이미지 src 교체 필요 */}
      {username ? (
        <div className="community-sidebar">
          <div id="sidebar-user-info">
            <img
              src="https://cdn.vectorstock.com/i/preview-1x/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg"
              className="sidebar-profile-img"
              alt="profile-image"
              data-bs-hover="tooltip"
              data-bs-placement="top"
              data-bs-title="프로필 페이지"
            ></img>
            <div id="sidebar-profile-name" onClick={onMyProfile}>
              {name}
            </div>
            <div id="sidebar-profile-username" onClick={onMyGithub}>
              <BsGithub />
              {githubUsername}
            </div>
          </div>
          <div className="sidebar-community-tab w-100">
            <div className="sidebar-activity hover-opacity">
              <a href="/community/activity/article">
                <span>내가 작성한 글</span>
              </a>
            </div>
            <div className="sidebar-activity hover-opacity">
              <a href="/community/activity/comment">
                <span>내가 작성한 댓글</span>
              </a>
            </div>
            <div className="sidebar-activity hover-opacity">
              <a href="/community/activity/scrap">
                <span>내가 스크랩한 글</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="community-sidebar">
          <div id="sidebar-user-info">
            <img
              src="https://cdn.vectorstock.com/i/preview-1x/77/30/default-avatar-profile-icon-grey-photo-placeholder-vector-17317730.jpg"
              className="sidebar-profile-img"
              alt="profile-image"
              data-bs-hover="tooltip"
              data-bs-placement="top"
              data-bs-title="프로필 페이지"
            ></img>
            <div id="sidebar-profile-name" onClick={onLogin}>
              로그인
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
