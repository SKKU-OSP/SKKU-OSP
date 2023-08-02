import { useState } from 'react';
import '../../User.css';
import { BsFillStarFill, BsXLg } from 'react-icons/bs';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import SkillModal from './SkillModal';
import InterestModal from './InterestModal';

function Interest() {
  // Interest 모달창
  const [interestShow, setInterestShow] = useState(false);
  const OnHandleInterestShow = () => setInterestShow(true);
  const OnHandleInterestClose = () => setInterestShow(false);
  const OnHandleInterestSaveClose = (modalInterest) => {
    setMyInterest(modalInterest), setInterestShow(false);
  };

  const [interest, setInterest] = useState([
    { value: '컨테이너', label: '컨테이너' },
    { value: 'CI/CD', label: 'CI/CD' },
    { value: 'UI', label: 'UI' },
    { value: 'UX', label: 'UX' }
  ]);
  const [myInterest, setMyInterest] = useState([
    { value: '컨테이너', label: '컨테이너' },
    { value: 'CI/CD', label: 'CI/CD' },
    { value: 'UI', label: 'UI' }
  ]);
  // interest와 myInterest 대한 값은 이제 서버에서 받아온거 하면 됨.

  // Skill 모달창
  const [skillShow, setSkillShow] = useState(false);
  const OnHandleSkillShow = () => setSkillShow(true);
  const OnHandleSkillClose = () => setSkillShow(false);
  const OnHandleSkillSaveClose = (modalSkill) => (setMySkill(modalSkill), setSkillShow(false));

  const [skill, setSkill] = useState([
    { value: 'Django', label: 'Django' },
    { value: 'React', label: 'React' },
    { value: 'Python', label: 'Python' },
    { value: 'HTML', label: 'HTML' },
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'JAVA', label: 'JAVA' },
    { value: 'Go', label: 'Go' },
    { value: 'C++', label: 'C++' }
  ]);
  const [mySkill, setMySkill] = useState({
    level1: ['Django'],
    level2: ['Python'],
    level3: ['React'],
    level4: ['Go'],
    level5: ['C++']
  });
  // skill과 mySkill 대한 값은 이제 서버에서 받아온거 하면 됨.

  return (
    <div className="d-flex flex-column profile-interest">
      <div className="d-flex flex-column profile-category">
        <div className="d-flex flex-row justify-content-between category-intro">
          <span className="intro">관심분야</span>
          <Button className="btn" onClick={OnHandleInterestShow} style={{ backgroundColor: 'white' }}>
            <span className="btn-text">수정</span>
          </Button>
          <InterestModal
            interest={interest}
            myInterest={myInterest}
            interestShow={interestShow}
            OnHandleInterestClose={OnHandleInterestClose}
            OnHandleInterestSaveClose={OnHandleInterestSaveClose}
          />
        </div>
        <div className="d-flex flex-row category-icon">
          {myInterest.map((interest) => (
            <div className="icon">
              <span className="icon-text">{interest.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="d-flex flex-column profile-language">
        <div className="d-flex flex-row justify-content-between language-intro">
          <span className="intro">사용언어/기술스택</span>
          <Button className="btn" onClick={OnHandleSkillShow} style={{ backgroundColor: 'white' }}>
            <span className="btn-text">수정</span>
          </Button>
          <SkillModal
            mySkill={mySkill}
            skill={skill}
            skillShow={skillShow}
            OnHandleSkillClose={OnHandleSkillClose}
            OnHandleSkillSaveClose={OnHandleSkillSaveClose}
          />
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '14px' }} />
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '26px' }} />
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '38px' }} />
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '50px' }} />
            <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '62px' }} />
          </div>
          {mySkill.level5.map((element) => (
            <div className="language">
              <span className="language-text">{element}</span>
            </div>
          ))}
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '20px' }} />
            <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '32px' }} />
            <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '44px' }} />
            <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '56px' }} />
          </div>
          {mySkill.level4.map((element) => (
            <div className="language">
              <span className="language-text">{element}</span>
            </div>
          ))}
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#0081DF" style={{ position: 'absolute', left: '26px' }} />
            <BsFillStarFill size={24} color="#0081DF" style={{ position: 'absolute', left: '38px' }} />
            <BsFillStarFill size={24} color="#0081DF" style={{ position: 'absolute', left: '50px' }} />
          </div>
          {mySkill.level3.map((element) => (
            <div className="language">
              <span className="language-text">{element}</span>
            </div>
          ))}
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#51B5FF" style={{ position: 'absolute', left: '32px' }} />
            <BsFillStarFill size={24} color="#51B5FF" style={{ position: 'absolute', left: '44px' }} />
          </div>
          {mySkill.level2.map((element) => (
            <div className="language">
              <span className="language-text">{element}</span>
            </div>
          ))}
        </div>
        <div className="d-flex flex-row language-level">
          <div className="d-flex flex-row justify-content-center align-items-center star-container">
            <BsFillStarFill size={24} color="#B5DFFF" />
          </div>
          {mySkill.level1.map((element) => (
            <div className="language">
              <span className="language-text">{element}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default Interest;
