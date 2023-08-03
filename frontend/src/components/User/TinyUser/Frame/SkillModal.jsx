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
  const starColor = props.starColor;
  const OnHandleSkillClose = props.OnHandleSkillClose;
  const OnHandleSkillSaveClose = props.OnHandleSkillSaveClose;

  const [modalSkill, setModalSkill] = useState(mySkill);
  const [selectedSkill, setSelectedSkill] = useState([]);
  const [undefinedSkill, setUndefinedSkill] = useState([]);

  const OnHandleSkillSelect = (selectedSkill) => setSelectedSkill(selectedSkill);
  const OnHandleUndefinedSkill = () => setUndefinedSkill([...undefinedSkill, selectedSkill]);
  const OnHandleRemoveSkill = (removeSkill) => {
    setUndefinedSkill((prevSkill) => prevSkill.filter((skill) => skill.label !== removeSkill.label));
  };

  useEffect(() => {
    setModalSkill(mySkill);
  }, [mySkill]);

  const OnHandleOnDrag = (e, skill) => {
    const skillJsonString = JSON.stringify(skill);
    e.dataTransfer.setData('skill', skillJsonString);
  };

  const OnHandleDragOver = (e) => {
    e.preventDefault();
  };

  const OnHandleOnDrop = (e, targetLevel) => {
    const skillJsonString = e.dataTransfer.getData('skill');
    const newSkill = JSON.parse(skillJsonString);
    if (!modalSkill[targetLevel].some((skill) => skill.label === newSkill.label)) {
      setModalSkill((prevLevels) => ({
        ...prevLevels,
        [targetLevel]: [...prevLevels[targetLevel], newSkill]
      }));
    }
    for (const level in modalSkill) {
      if (level !== targetLevel) {
        setModalSkill((prevLevels) => ({
          ...prevLevels,
          [level]: prevLevels[level].filter((skill) => skill.label !== newSkill.label)
        }));
      }
    }
    setUndefinedSkill((prev) => prev.filter((skill) => skill.label !== newSkill.label));
  };

  const OnHandleRemoveModalSkill = (removeSkill, level) => {
    setModalSkill((prevLevels) => ({
      ...prevLevels,
      [level]: prevLevels[level].filter((skill) => skill.label !== removeSkill.label)
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
              name="skill"
              onChange={OnHandleSkillSelect}
              options={skill.filter(
                (item) =>
                  !Object.values(modalSkill)
                    .flat()
                    .some((obj) => obj.value === item.value)
              )}
            />
            <button className="btn" onClick={OnHandleUndefinedSkill}>
              <span className="btn-text">+</span>
            </button>
          </div>
          <div className="d-flex flex-row modal-skill-result">
            {undefinedSkill.map((skill) => (
              <div
                draggable
                onDragStart={(e) => OnHandleOnDrag(e, skill)}
                className="d-flex flex-row align-items-center modal-input"
              >
                <span className="input-text">{skill.label}</span>
                <BsXLg size={14} onClick={() => OnHandleRemoveSkill(skill)} style={{ cursor: 'pointer' }} />
              </div>
            ))}
          </div>
          {Object.entries(modalSkill)
            .reverse()
            .map(([level, tags]) => {
              return (
                <div className="d-flex flex-row modal-language-level" key={`modal-level-${level}`}>
                  <div className="d-flex flex-row justify-content-center align-items-center modal-star-container">
                    {Array(Number(level) + 1)
                      .fill(0)
                      .map((element, idx) => {
                        return (
                          <BsFillStarFill
                            size={24}
                            color={starColor[level]}
                            style={{ margin: '-6px' }}
                            key={`modal-star-${level}-${idx}`}
                          />
                        );
                      })}
                  </div>
                  <div
                    className="d-flex flex-row gap-1 modal-level"
                    onDrop={(e) => OnHandleOnDrop(e, level)}
                    onDragOver={OnHandleDragOver}
                  >
                    {tags.map((element) => (
                      <div
                        draggable
                        onDragStart={(e) => OnHandleOnDrag(e, element)}
                        className="d-flex flex-row gap-1 align-items-center modal-language"
                      >
                        <span className="modal-language-text">{element.label}</span>
                        <BsXLg
                          size={14}
                          onClick={() => OnHandleRemoveModalSkill(element, level)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
