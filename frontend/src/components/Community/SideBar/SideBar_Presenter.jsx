import '../Community.css';
import {
  BsChevronUp,
  BsFillFileTextFill,
  BsFillTrophyFill,
  BsFillHandThumbsUpFill,
  BsPlusCircleDotted,
  BsFillChatTextFill,
  BsQuestionCircleFill,
  BsFillInfoCircleFill,
  BsFillMegaphoneFill,
  BsFillPersonPlusFill
} from 'react-icons/bs';

export default function SideBar_Presenter() {
  return (
    <div className="col-md-3 community-sidebar">
      <div className="profile-tab">
        {/* is_authenticated 확인 & 프로필 이미지 src 교체 필요 */}
        {1 === 1 ? (
          <div id="sidebar-user-info">
            <a>
              <img
                width="42px"
                height="42px"
                src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                className="profile-img"
                alt="profile-image"
                data-bs-hover="tooltip"
                data-bs-placement="top"
                data-bs-title="프로필 페이지"
              ></img>
              <span id="profile-username">username</span>
            </a>
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
      <div id="community-tab" className="w-100">
        {/* is_authenticated 확인 필요 */}
        {/* 내 활동 */}
        {1 === 1 && (
          <div>
            <div className="boardgroup-title">
              <span>내 활동</span>
            </div>
            <div className="boardgroup-item hover-opacity">
              <a href="/community/activity/">
                <BsFillFileTextFill size="22" />
                <span>내 활동 목록</span>
              </a>
            </div>
            <div className="boardgroup-item hover-opacity">
              <a href="/challenge/">
                <BsFillTrophyFill size="22" />
                <span>챌린지</span>
              </a>
            </div>
            <div className="boardgroup-item hover-opacity">
              <a href="/community/recommender/user/">
                <BsFillHandThumbsUpFill size="22" />
                <span>맞춤 유저 추천</span>
              </a>
            </div>
          </div>
        )}

        {/* 일반 게시판 */}
        <div id="normal-boardgroup" className="boardgroup-title">
          <a href="/community/">게시판</a>
          <i className="bi bi-chevron-up folder hover-opacity" data-fold-target=".link-board"></i>
        </div>
        <div className="boardgroup-item hover-opacity">
          <a href="/community/board/자유">
            <BsFillChatTextFill size="22" />
            <span>자유</span>
          </a>
        </div>
        <div className="boardgroup-item hover-opacity">
          <a href="/community/board/질문">
            <BsQuestionCircleFill size="22" />
            <span>질문</span>
          </a>
        </div>
        <div className="boardgroup-item hover-opacity">
          <a href="/community/board/정보">
            <BsFillInfoCircleFill size="22" />
            <span>정보</span>
          </a>
        </div>
        <div className="boardgroup-item hover-opacity">
          <a href="/community/board/홍보">
            <BsFillMegaphoneFill size="22" />
            <span>홍보</span>
          </a>
        </div>
        <div className="boardgroup-item hover-opacity">
          <a href="/community/board/팀 모집">
            <BsFillPersonPlusFill size="22" />
            <span>팀 모집</span>
          </a>
        </div>

        {/* 팀 게시판 */}
        {/* is_authenticated 확인 필요 */}
        {1 === 1 && (
          <div>
            <div id="team-boardgroup" className="boardgroup-title">
              <span>팀 게시판</span>
            </div>

            <div id="team-create" className="boardgroup-item hover-opacity">
              <a herf="#" role="button">
                <BsPlusCircleDotted size="22" />
                <span>팀 만들기</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
