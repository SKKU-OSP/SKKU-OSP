import './SideBar.css';

export default function SideBar_Presenter() {
  return (
    <div className="col-md-3">
      {/* is_authenticated 확인 & 프로필 이미지 src 교체 필요 */}
      {1 === 1 ? (
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
            <div id="sidebar-profile-name">성이름</div>
            <div id="sidebar-profile-username">username</div>
          </div>
          <div className="sidebar-community-tab w-100">
            <div className="sidebar-activity hover-opacity">
              <a href="/community/activity/">
                <span>내가 작성한 글</span>
              </a>
            </div>
            <div className="sidebar-activity hover-opacity">
              <a href="/challenge/">
                <span>내가 작성한 댓글</span>
              </a>
            </div>
            <div className="sidebar-activity hover-opacity">
              <a href="/community/recommender/user/">
                <span>내가 스크랩한 글</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div id="sidebar-user-info">
          <a href="/accounts/login/">
            <img
              width="42px"
              height="42px"
              src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
              className="profile-img"
              alt="profile-image"
            ></img>
            <span id="profile-username">Log In</span>
          </a>
        </div>
      )}
    </div>
  );
}
