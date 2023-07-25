import '../User.css';
import { BsGithub } from 'react-icons/bs';

function Profile_Info() {
  const img_url = '/images/empty-profile.png';
  return (
    <div className="d-flex flex-row profile_info">
      <div className="d-flex align-items-center justify-content-center info_left">
        <div className="info_img" style={{ backgroundImage: `url(${img_url})` }}></div>
      </div>
      <div className="d-flex flex-column info_right">
        <div className="d-flex flex-row justify-content-end info_button">
          <button className="info_btn-1">
            <span className="info_btn-1-text">대시보드</span>
          </button>
          <button className="info_btn-2">
            <span className="info_btn-2-text">프로필 수정</span>
          </button>
        </div>
        <div className="info_username">
          <span className="username">Jeongyeop</span>
        </div>
        <div className="d-flex flex-row info_github">
          <BsGithub />
          <span className="github_username">Jeongyeop</span>
        </div>
        <span className="info_introduction">
          자기소개를 길게 한번 써볼게요 성균관대학교 소프트웨어학과 18학번 서정엽입니다. SSA 오픈소스플랫폼 팀에서
          SOSD를 개발하고 있습니다. 자기소개를 길게 한번 써볼게요 성균관대학교 소프트웨어학과 18학번 서정엽입니다. SSA
          오픈소스플랫폼 팀에서 SOSD를 개발하고 있습니다. 자기소개를 길게 한번 써볼게요 성균관대학교 소프트웨어학과
          18학번 서정엽입니다. SSA 오픈소스플랫폼 팀에서 SOSD를 개발하고 .....
        </span>
      </div>
    </div>
  );
}
export default Profile_Info;
