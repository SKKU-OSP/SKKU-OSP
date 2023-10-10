import { useEffect, useState } from 'react';

import axios from 'axios';
import { useParams } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { BsFillStarFill } from 'react-icons/bs';

import SkillModal from './SkillModal';
import InterestModal from './InterestModal';
import { getAuthConfig } from '../../../../utils/auth';

import '../../User.css';

const server_url = import.meta.env.VITE_SERVER_URL;
const tagsUrl = server_url + '/tag/api/list/';
const profileInterestPostUrl = server_url + '/user/api/interests/update/';
const profileSkillPostUrl = server_url + '/user/api/langs/update/';
function Interest() {
  // Interest 훅
  const [interestShow, setInterestShow] = useState(false);
  const [interest, setInterest] = useState([]);
  const [myInterest, setMyInterest] = useState();

  // Skill 훅
  const [skillShow, setSkillShow] = useState(false);
  const [skill, setSkill] = useState([]);
  const [mySkill, setMySkill] = useState();

  const [error_occur, setError] = useState(false);
  // 서버와 연동
  const { username } = useParams();

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
      } catch (error) {
        console.log('getTags error', error);
        setError(true);
      }
    };
    const getProfileTags = async () => {
      try {
        const profileTagsUrl = server_url + '/user/api/tag/' + username;
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
        } else {
          console.log('getProfileTags error', res.errors);
        }
      } catch (error) {
        setError(true);
      }
    };
    getTags();
    getProfileTags();
  }, [username]);

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
        obj.value = obj.tag.name;
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
    <>
      {error_occur ? (
        <>잘못된 페이지 입니다.</>
      ) : (
        <>
          {myInterest && mySkill ? (
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
                <div className="d-flex flex-row flex-wrap category-icon">
                  {myInterest.map((interest) => (
                    <div className="icon" key={interest.value}>
                      <span className="icon-text">{interest.value}</span>
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
                    starColor={starColor}
                  />
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
                        {tags.map((element) => {
                          const color = element.tag.color;
                          const hexColor = color.substring(1);
                          const r = parseInt(hexColor.substring(0, 2), 16) & 0xff;
                          const g = parseInt(hexColor.substring(2, 4), 16) & 0xff;
                          const b = parseInt(hexColor.substring(4, 6), 16) & 0xff;
                          const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                          const fontColor = luma < 127.5 ? 'white' : 'black';
                          const logo = element.tag.logo;
                          return (
                            <div
                              className="language"
                              style={{ backgroundColor: `${element.tag.color}` }}
                              key={`language-level-${level}-${element.tag.name}`}
                            >
                              {logo !== 'default.svg' ? (
                                <img
                                  className="stack-icon"
                                  src={`${element.tag.logo}`}
                                  style={{
                                    WebkitFilter:
                                      fontColor === 'white'
                                        ? 'brightness(0) invert(1)'
                                        : 'grayscale(100%) brightness(0)',
                                    filter:
                                      fontColor === 'white'
                                        ? 'brightness(0) invert(1)'
                                        : 'grayscale(100%) brightness(0)'
                                  }}
                                />
                              ) : (
                                <></>
                              )}
                              <span className="language-text" style={{ color: fontColor }}>
                                {element.tag.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <Spinner animation="border" style={{ position: 'absolute', top: '50%', left: '50%' }} />
          )}
        </>
      )}
    </>
  );
}
export default Interest;
