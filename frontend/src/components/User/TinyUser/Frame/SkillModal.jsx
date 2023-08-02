import { useEffect, useState } from 'react';
import '../../User.css';
import { BsFillStarFill, BsXLg } from 'react-icons/bs';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

function SkillModal(props) {
  const skill = props.skill;
  const mySkill = props.mySkill;
  const skillShow = props.skillShow;
  const OnHandleSkillClose = props.OnHandleSkillClose;
  const OnHandleSkillSaveClose = props.OnHandleSkillSaveClose;
  const [modalSkill, setModalSkill] = useState(mySkill);
  const [selectedSkill, setSelectedSkill] = useState([]);
  const [undefinedSkill, setUndefinedSkill] = useState([]);
  const OnHandleSkillSelect = (selectedSkill) => setSelectedSkill(selectedSkill);
  const OnHandleUndefinedSkill = () => setUndefinedSkill(selectedSkill);
  const OnHandleRemoveSkill = (removeLabel) => {
    setUndefinedSkill((prevSkill) => prevSkill.filter((skill) => skill.label !== removeLabel));
  };
  useEffect(() => {
    setSelectedSkill(undefinedSkill);
  }, [undefinedSkill]);

  function OnHandleOnDrag(e, skillName) {
    e.dataTransfer.setData('skill', skillName);
  }

  function OnHandleDragOver(e) {
    e.preventDefault();
  }

  function OnHandleOnDrop(e, targetLevel) {
    const newSkill = e.dataTransfer.getData('skill');
    if (!modalSkill[targetLevel].includes(newSkill)) {
      setModalSkill((prevLevels) => ({
        ...prevLevels,
        [targetLevel]: [...prevLevels[targetLevel], newSkill]
      }));
    }
    for (const level in modalSkill) {
      console.log(level);
      if (level !== targetLevel) {
        setModalSkill((prevLevels) => ({
          ...prevLevels,
          [level]: prevLevels[level].filter((skill) => skill !== newSkill)
        }));
      }
    }
    setUndefinedSkill((prev) => prev.filter((skill) => skill.label !== newSkill));
    setSelectedSkill((prev) => prev.filter((skill) => skill.label !== newSkill));
  }

  const OnHandleRemoveModalSkill = (removeSkill, level) => {
    setModalSkill((prevLevels) => ({
      ...prevLevels,
      [level]: prevLevels[level].filter((skill) => skill !== removeSkill)
    }));
  };

  return (
    <Modal size="lg" show={skillShow} onHide={OnHandleSkillClose}>
      <Modal.Header closeButton>
        <Modal.Title>사용언어/기술스택</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column modal-skill">
          <div className="modal-skill-message">사용언어/기술스택 태그를 드래그하여 배치하세요.</div>
          <div className="d-flex flex-row modal-skill-input">
            <Select
              className="modal-skill-select"
              size="lg"
              isMulti={true}
              name="skill"
              value={selectedSkill}
              onChange={OnHandleSkillSelect}
              options={skill.filter((item) => !Object.values(modalSkill).flat().includes(item.value))}
            />
            <button className="btn" onClick={OnHandleUndefinedSkill}>
              <span className="btn-text">+</span>
            </button>
          </div>
          <div className="d-flex flex-row modal-skill-result">
            {undefinedSkill.map((skill) => (
              <div
                draggable
                onDragStart={(e) => OnHandleOnDrag(e, skill.label)}
                className="d-flex flex-row align-items-center modal-input"
              >
                <span className="input-text">{skill.label}</span>
                <BsXLg size={14} onClick={() => OnHandleRemoveSkill(skill.label)} style={{ cursor: 'pointer' }} />
              </div>
            ))}
          </div>
          <div className="d-flex flex-row modal-language-level">
            <div className="d-flex flex-row justify-content-center align-items-center modal-star-container">
              <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '14px' }} />
              <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '26px' }} />
              <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '38px' }} />
              <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '50px' }} />
              <BsFillStarFill size={24} color="#002743" style={{ position: 'absolute', left: '62px' }} />
            </div>
            <div
              className="d-flex flex-row gap-1 modal-level"
              onDrop={(e) => OnHandleOnDrop(e, 'level5')}
              onDragOver={OnHandleDragOver}
            >
              {modalSkill.level5.map((element, index) => (
                <div
                  draggable
                  onDragStart={(e) => OnHandleOnDrag(e, element)}
                  className="d-flex flex-row gap-1 align-items-center modal-language"
                  key={index}
                >
                  <span className="modal-language-text">{element}</span>
                  <BsXLg
                    size={14}
                    onClick={() => OnHandleRemoveModalSkill(element, 'level5')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="d-flex flex-row modal-language-level">
            <div className="d-flex flex-row justify-content-center align-items-center modal-star-container">
              <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '20px' }} />
              <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '32px' }} />
              <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '44px' }} />
              <BsFillStarFill size={24} color="#00518C" style={{ position: 'absolute', left: '56px' }} />
            </div>
            <div
              className="d-flex flex-row gap-1 modal-level"
              onDrop={(e) => OnHandleOnDrop(e, 'level4')}
              onDragOver={OnHandleDragOver}
            >
              {modalSkill.level4.map((element, index) => (
                <div
                  draggable
                  onDragStart={(e) => OnHandleOnDrag(e, element)}
                  className="d-flex flex-row gap-1 align-items-center modal-language"
                  key={index}
                >
                  <span className="modal-language-text">{element}</span>
                  <BsXLg
                    size={14}
                    onClick={() => OnHandleRemoveModalSkill(element, 'level4')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="d-flex flex-row modal-language-level">
            <div className="d-flex flex-row justify-content-center align-items-center modal-star-container">
              <BsFillStarFill size={24} color="#0081DF" style={{ position: 'absolute', left: '26px' }} />
              <BsFillStarFill size={24} color="#0081DF" style={{ position: 'absolute', left: '38px' }} />
              <BsFillStarFill size={24} color="#0081DF" style={{ position: 'absolute', left: '50px' }} />
            </div>
            <div
              className="d-flex flex-row gap-1 modal-level"
              onDrop={(e) => OnHandleOnDrop(e, 'level3')}
              onDragOver={OnHandleDragOver}
            >
              {modalSkill.level3.map((element, index) => (
                <div
                  draggable
                  onDragStart={(e) => OnHandleOnDrag(e, element)}
                  className="d-flex flex-row gap-1 align-items-center modal-language"
                  key={index}
                >
                  <span className="modal-language-text">{element}</span>
                  <BsXLg
                    size={14}
                    onClick={() => OnHandleRemoveModalSkill(element, 'level3')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="d-flex flex-row modal-language-level">
            <div className="d-flex flex-row justify-content-center align-items-center modal-star-container">
              <BsFillStarFill size={24} color="#51B5FF" style={{ position: 'absolute', left: '32px' }} />
              <BsFillStarFill size={24} color="#51B5FF" style={{ position: 'absolute', left: '44px' }} />
            </div>
            <div
              className="d-flex flex-row gap-1 modal-level"
              onDrop={(e) => OnHandleOnDrop(e, 'level2')}
              onDragOver={OnHandleDragOver}
            >
              {modalSkill.level2.map((element, index) => (
                <div
                  draggable
                  onDragStart={(e) => OnHandleOnDrag(e, element)}
                  className="d-flex flex-row gap-1 align-items-center modal-language"
                  key={index}
                >
                  <span className="modal-language-text">{element}</span>
                  <BsXLg
                    size={14}
                    onClick={() => OnHandleRemoveModalSkill(element, 'level2')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="d-flex flex-row modal-language-level">
            <div className="d-flex flex-row justify-content-center align-items-center modal-star-container">
              <BsFillStarFill size={24} color="#B5DFFF" />
            </div>
            <div
              className="d-flex flex-row gap-1 modal-level"
              onDrop={(e) => OnHandleOnDrop(e, 'level1')}
              onDragOver={OnHandleDragOver}
            >
              {modalSkill.level1.map((element, index) => (
                <div
                  draggable
                  onDragStart={(e) => OnHandleOnDrag(e, element)}
                  className="d-flex flex-row gap-1 align-items-center modal-language"
                  key={index}
                >
                  <span className="modal-language-text">{element}</span>
                  <BsXLg
                    size={14}
                    onClick={() => OnHandleRemoveModalSkill(element, 'level1')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-dark" onClick={() => OnHandleSkillSaveClose(modalSkill)}>
          저장
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
export default SkillModal;
