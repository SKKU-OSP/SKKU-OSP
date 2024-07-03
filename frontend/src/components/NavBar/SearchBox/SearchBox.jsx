import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';
import Select from 'react-select';
import { BsSearch, BsHash, BsXLg } from 'react-icons/bs';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import './SearchBox.css';

const server_url = import.meta.env.VITE_SERVER_URL;
function SearcherBox() {
  // const [curBoard, setCurBoard] = useState({ label: '질문', value: 1 });
  // const [normalBoards, setNormalBoards] = useState([
  //   { label: '팀 모집', value: 2 },
  //   { label: '정보', value: 5 },
  //   { label: '홍보', value: 6 }
  // ]);
  // const [teamBoards, setTeamBoards] = useState([
  //   { label: 'Team1', value: 9 },
  //   { label: 'SOSD 베타 테스팅', value: 52 }
  // ]);
  // const [fieldData, setFieldData] = useState([{ label: '전체', value: 0 }]);
  // useEffect(() => {
  //   setFieldData([...fieldData, ...normalBoards, ...teamBoards]);
  // }, []);

  const [tagData, setTagData] = useState(null);
  const [keyword, setKeyword] = useState('');

  const navigate = useNavigate();
  const searchArticle = () => {
    if (keyword !== '' || tagData != null) {
      navigate('/community/search', {
        state: {
          keyword: keyword,
          tag: tagData
        }
      });
      setKeyword('');
      setTagData(null);
      setTagSearchInterest([]);
      setTagSearchSkill([]);
    } else {
      alert('검색어를 입력해주시거나 Tag를 선택해주세요.');
    }
  };
  const handleKeyword = (e) => {
    setKeyword(e.target.value);
  };
  const handleEnter = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      searchArticle();
    }
  };

  const [tagInterest, setTagInterest] = useState([]); // 전체 관심분야
  const [tagSelectedInterest, setTagSelectedInterest] = useState([]); // Select에서 선택한 관심분야
  const [tagModalInterest, setTagModalInterest] = useState([]); // 모달에서 선택한 관심분야
  const [tagSearchInterest, setTagSearchInterest] = useState([]); // 선택한 관심분야
  const handleInterestSelect = (Interest) => setTagSelectedInterest(Interest); // Select에서 관심분야 선택
  const handleSaveInterest = () => {
    if (tagSelectedInterest) {
      setTagModalInterest([...tagModalInterest, tagSelectedInterest]);
      setTagSelectedInterest([]);
    }
  }; // Select한 관심분야 저장
  const handleRemoveInterest = (removeLabel) => {
    setTagModalInterest(tagModalInterest?.filter((interest) => interest.label !== removeLabel));
  }; // Select한 관심분야 삭제

  const [tagSkill, setTagSkill] = useState([]); // 전체 언어
  const [tagSelectedSkill, setTagSelectedSkill] = useState([]); // Select에서 선택한 관심언어
  const [tagModalSkill, setTagModalSkill] = useState([]); // 모달에서 선택한 관심언어
  const [tagSearchSkill, setTagSearchSkill] = useState([]); // 선택한 관심언어
  const handleSkillSelect = (Skill) => setTagSelectedSkill(Skill); // Select에서 관심언어 선택
  const handleSaveSkill = () => {
    if (tagSelectedSkill) {
      setTagModalSkill([...tagModalSkill, tagSelectedSkill]);
      setTagSelectedSkill([]);
    }
  }; // Select한 관심언어 저장
  const handleRemoveSkill = (removeLabel) => {
    setTagModalSkill(tagModalSkill?.filter((Skill) => Skill.label !== removeLabel));
  }; // Select한 관심언어 삭제

  const [tagSelectShow, setTagSelectShow] = useState(false);
  const handleTagSelectShow = () => {
    setTagModalInterest(tagSearchInterest);
    setTagModalSkill(tagSearchSkill);
    setTagSelectedInterest([]);
    setTagSelectedSkill([]);
    setTagSelectShow(true);
  };
  const handleTagSelectClose = () => setTagSelectShow(false);
  const handleTagSelectSaveClose = () => {
    const tags = [...tagModalInterest, ...tagModalSkill];
    const tagString = tags.map((tag) => tag.value).join(', ');
    setTagData(tagString);
    setTagSearchInterest(tagModalInterest);
    setTagSearchSkill(tagModalSkill);
    setTagSelectShow(false);
  };

  useEffect(() => {
    if (!tagSelectShow) {
      return;
    }
    const getTags = async () => {
      try {
        const tagsUrl = server_url + '/tag/api/list/';
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
          setTagInterest(interest);
          setTagSkill(skill);
        }
      } catch (error) {}
    };
    getTags();
  }, [tagSelectShow]);

  return (
    <div className="searchBox">
      <div className="search">
        <input
          type="text"
          className="form-control"
          value={keyword}
          placeholder="검색"
          aria-describedby="search-btn"
          onChange={(e) => handleKeyword(e)}
          onKeyDown={(e) => handleEnter(e)}
          style={{ fontFamily: 'nanumfont_Regular', letterSpacing: "1.5px"}}
        />
        <BsHash className="hash-icon" size="24" onClick={() => handleTagSelectShow()} />
        <BsSearch className="search-icon" onClick={() => searchArticle()} />
        <Modal show={tagSelectShow} onHide={handleTagSelectClose}>
          <Modal.Header closeButton>
            <Modal.Title>Tag 추가</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex flex-row modal-interest-input">
              <Select
                className="modal-interest-select"
                size="lg"
                name="interest"
                value={tagSelectedInterest}
                onChange={handleInterestSelect}
                options={tagInterest.filter((item) => !tagModalInterest?.some((mi) => item.value === mi.value))}
              />
              <button className="btn" onClick={handleSaveInterest}>
                <span className="btn-text">+</span>
              </button>
            </div>
            <div className="d-flex flex-row flex-wrap modal-interest-result">
              {tagModalInterest?.length > 0 ? (
                <>
                  {tagModalInterest.map((interest) => (
                    <div
                      className="d-flex flex-row align-items-center modal-input"
                      key={`modal-interest-${interest.value}`}
                    >
                      <span className="input-text">{interest.label}</span>
                      <BsXLg
                        size={14}
                        onClick={() => handleRemoveInterest(interest.label)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                </>
              ) : (
                '선택한 관심분야가 없습니다.'
              )}
            </div>
            <div className="d-flex flex-row modal-skill-input">
              <Select
                className="modal-skill-select"
                size="lg"
                name="skill"
                value={tagSelectedSkill}
                onChange={handleSkillSelect}
                options={tagSkill.filter((item) => !tagModalSkill?.some((mi) => item.value === mi.value))}
              />
              <button className="btn" onClick={handleSaveSkill}>
                <span className="btn-text">+</span>
              </button>
            </div>
            <div className="d-flex flex-row flex-wrap modal-skill-result">
              {tagModalSkill?.length > 0 ? (
                <>
                  {tagModalSkill.map((skill) => (
                    <div className="d-flex flex-row align-items-center modal-input" key={`modal-skill-${skill.value}`}>
                      <span className="input-text">{skill.label}</span>
                      <BsXLg size={14} onClick={() => handleRemoveSkill(skill.label)} style={{ cursor: 'pointer' }} />
                    </div>
                  ))}
                </>
              ) : (
                '선택한 관심언어가 없습니다.'
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => handleTagSelectSaveClose()}>
              저장
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default SearcherBox;
