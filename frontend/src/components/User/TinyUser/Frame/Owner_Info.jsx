import '../../User.css';
import { FaUniversity } from 'react-icons/fa';
import { BsFillCheckCircleFill, BsGithub } from 'react-icons/bs';
import { MdAlternateEmail } from 'react-icons/md';
function Owner_Info() {
  return (
    <div className="d-flex flex-column profile-owner-info">
      <div className="d-flex flex-column info-university">
        <div className="d-flex justify-content-center">
          <FaUniversity size={24} />
        </div>
        <span className="info-uniName">성균관대학교</span>
        <span className="info-uniMajor">소프트웨어학과</span>
        <div className="d-flex flex-row justify-content-center gap-1 info-uniId">
          <span className="uniId">2019312264</span>
          <BsFillCheckCircleFill size={16} />
        </div>
      </div>
      <div className="d-flex flex-column info-email">
        <div className="d-flex justify-content-center">
          <MdAlternateEmail size={24} />
        </div>
        <span className="email">ploki7335@naver.com</span>
      </div>
      <div className="d-flex flex-column info-github">
        <div className="d-flex justify-content-center">
          <BsGithub size={24} />
        </div>
        <span className="name">605s</span>
      </div>
    </div>
  );
}
export default Owner_Info;
