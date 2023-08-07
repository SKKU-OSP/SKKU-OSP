import { useEffect, useState } from 'react';
import '../../User.css';
import { BsFillStarFill, BsXLg } from 'react-icons/bs';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import SkillModal from './SkillModal';
import InterestModal from './InterestModal';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';

function Interest() {
  // Interest 훅
  const [interestShow, setInterestShow] = useState(false);
  const [interest, setInterest] = useState([]);
  const [myInterest, setMyInterest] = useState([]);

  // Skill 훅
  const [skillShow, setSkillShow] = useState(false);
  const [skill, setSkill] = useState([]);
  const [mySkill, setMySkill] = useState({ 4: [], 3: [], 2: [], 1: [], 0: [] });

  // 서버와 연동
  const server_url = import.meta.env.VITE_SERVER_URL;
  const profileTagsUrl = server_url + '/user/api/tag/72/';
  const tagsUrl = server_url + '/tag/api/list/';
  const profileInterestPostUrl = server_url + '/user/api/interests/update/';
  const profileSkillPostUrl = server_url + '/user/api/langs/update/';

  // 서버에서 데이터 받아오기
  useEffect(() => {
    const getTags = async () => {
      try {
        const response = await axios.get(tagsUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          const tags = res.data.tags;
          const interest = tags
            .filter((tag) => tag.type === 'domain')
            .map((tag) => {
              return { ...tag, value: tag.name, label: tag.name };
            });
          const skill = tags
            .filter((tag) => tag.type !== 'domain')
            .map((tag) => {
              return { ...tag, value: tag.name, label: tag.name };
            });
          setInterest(interest);
          setSkill(skill);
        }
      } catch (error) {}
    };
    const getProfileTags = async () => {
      try {
        const response = await axios.get(profileTagsUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          const profileTags = res.data.interest_tags;
          const profileInterest = profileTags
            .filter((interest) => interest.tag.type === 'domain')
            .map((interest) => {
              return { ...interest, value: interest.tag.name, label: interest.tag.name };
            });
          const profileSkill = profileTags
            .filter((skill) => skill.tag.type !== 'domain')
            .map((skill) => {
              return { ...skill, value: skill.tag.name, label: skill.tag.name };
            });
          const profileSkillLevel = { 4: [], 3: [], 2: [], 1: [], 0: [] };
          profileSkill.forEach((skill) => {
            profileSkillLevel[skill.level].push(skill);
          });
          setMyInterest(profileInterest);
          setMySkill(profileSkillLevel);
        }
      } catch (error) {}
    };
    getTags();
    getProfileTags();
  }, []);

  // 서버에 데이터 저장
  const updatePostProfileInterest = async (updateInterest) => {
    await axios.post(profileInterestPostUrl, { user_interests: updateInterest }, getAuthConfig());
  };
  const updatePostProfileSkill = async (updateSkill) => {
    await axios.post(profileSkillPostUrl, { user_langs: updateSkill }, getAuthConfig());
  };

  // Interest 모달 함수
  const OnHandleInterestShow = () => setInterestShow(true);
  const OnHandleInterestClose = () => setInterestShow(false);
  const OnHandleInterestSaveClose = (modalInterest) => {
    setMyInterest(modalInterest), setInterestShow(false), updatePostProfileInterest(modalInterest);
  };

  // Skill 모달 함수
  const OnHandleSkillShow = () => setSkillShow(true);
  const OnHandleSkillClose = () => setSkillShow(false);
  const OnHandleSkillSaveClose = (modalSkill) => {
    Object.keys(modalSkill).forEach((key) => {
      modalSkill[key].forEach((obj) => {
        obj.level = Number(key);
      });
    });
    setMySkill(modalSkill), setSkillShow(false), updatePostProfileSkill(modalSkill);
  };

  const starColor = {
    4: '#002743',
    3: '#00518C',
    2: '#0081DF',
    1: '#51B5FF',
    0: '#B5DFFF'
  };

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
            <div className="icon" key={interest.id}>
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
          {
            <SkillModal
              mySkill={mySkill}
              skill={skill}
              skillShow={skillShow}
              OnHandleSkillClose={OnHandleSkillClose}
              OnHandleSkillSaveClose={OnHandleSkillSaveClose}
              starColor={starColor}
            />
          }
        </div>
        {Object.entries(mySkill)
          .reverse()
          .map(([level, tags]) => {
            return (
              <div className="d-flex flex-row language-level" key={`level-${level}`}>
                <div className="d-flex flex-row justify-content-center align-items-center star-container">
                  {Array(Number(level) + 1)
                    .fill(0)
                    .map((element, idx) => {
                      return (
                        <BsFillStarFill
                          size={24}
                          color={starColor[level]}
                          style={{ margin: '-6px' }}
                          key={`star-${level}-${idx}`}
                        />
                      );
                    })}
                </div>
                {tags.map((element) => (
                  <div className="language">
                    <span className="language-text">{element.label}</span>
                  </div>
                ))}
              </div>
            );
          })}
      </div>
    </div>
  );
}
export default Interest;
