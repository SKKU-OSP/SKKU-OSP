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
  const OnHandleUndefinedSkill = () => setUndefinedSkill([...undefinedSkill, { tag: selectedSkill }]);
  const OnHandleRemoveSkill = (removeSkill) => {
    setUndefinedSkill((prevSkill) => prevSkill.filter((skill) => skill.label !== removeSkill.label));
  };

  useEffect(() => {
    setUndefinedSkill([]);
    setModalSkill(mySkill);
  }, [skillShow]);

  const OnHandleOnDrag = (e, skill) => {
    console.log(skill);
    const skillJsonString = JSON.stringify(skill);
    e.dataTransfer.setData('skill', skillJsonString);
  };

  const OnHandleDragOver = (e) => {
    e.preventDefault();
  };

  const OnHandleOnDrop = (e, targetLevel) => {
    const skillJsonString = e.dataTransfer.getData('skill');
    const newSkill = JSON.parse(skillJsonString);
    if (!modalSkill[targetLevel].some((skill) => skill.tag.name === newSkill.tag.name)) {
      setModalSkill((prevLevels) => ({
        ...prevLevels,
        [targetLevel]: [...prevLevels[targetLevel], newSkill]
      }));
    }
    for (const level in modalSkill) {
      if (level !== targetLevel) {
        setModalSkill((prevLevels) => ({
          ...prevLevels,
          [level]: prevLevels[level].filter((skill) => skill.tag.name !== newSkill.tag.name)
        }));
      }
    }
    setUndefinedSkill((prev) => prev.filter((skill) => skill.tag.name !== newSkill.tag.name));
  };

  const OnHandleRemoveModalSkill = (removeSkill, level) => {
    setModalSkill((prevLevels) => ({
      ...prevLevels,
      [level]: prevLevels[level].filter((skill) => skill.tag.name !== removeSkill.tag.name)
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
              options={skill
                .filter(
                  (item) =>
                    !Object.values(modalSkill)
                      .flat()
                      .some((obj) => obj.tag.name === item.name)
                )
                .filter(
                  (item) =>
                    !Object.values(undefinedSkill)
                      .flat()
                      .some((obj) => obj.tag.name === item.name)
                )}
            />
            <button className="btn" onClick={OnHandleUndefinedSkill}>
              <span className="btn-text">+</span>
            </button>
          </div>
          <div className="d-flex flex-row modal-skill-result">
            {undefinedSkill.map((element) => {
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
                  draggable
                  onDragStart={(e) => OnHandleOnDrag(e, element)}
                  className="d-flex flex-row align-items-center modal-input"
                  style={{ backgroundColor: `${element.tag.color}` }}
                  key={`modal-undefined-language-${element.tag.name}`}
                >
                  {logo !== 'default.svg' ? (
                    <img
                      className="modal-stack-icon"
                      src={`${element.tag.logo}`}
                      style={{
                        WebkitFilter:
                          fontColor === 'white' ? 'brightness(0) invert(1)' : 'grayscale(100%) brightness(0)',
                        filter: fontColor === 'white' ? 'brightness(0) invert(1)' : 'grayscale(100%) brightness(0)'
                      }}
                    />
                  ) : (
                    <></>
                  )}
                  <span className="input-text" style={{ color: fontColor }}>
                    {element.tag.name}
                  </span>
                  <BsXLg size={14} onClick={() => OnHandleRemoveSkill(skill)} style={{ cursor: 'pointer' }} />
                </div>
              );
            })}
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
                          draggable
                          onDragStart={(e) => OnHandleOnDrag(e, element)}
                          className="d-flex flex-row gap-1 align-items-center modal-language"
                          style={{ backgroundColor: `${element.tag.color}` }}
                          key={`modal-language-level-${level}-${element.tag.name}`}
                        >
                          {logo !== 'default.svg' ? (
                            <img
                              className="modal-stack-icon"
                              src={`${element.tag.logo}`}
                              style={{
                                WebkitFilter:
                                  fontColor === 'white' ? 'brightness(0) invert(1)' : 'grayscale(100%) brightness(0)',
                                filter:
                                  fontColor === 'white' ? 'brightness(0) invert(1)' : 'grayscale(100%) brightness(0)'
                              }}
                            />
                          ) : (
                            <></>
                          )}
                          <span className="modal-language-text" style={{ color: fontColor }}>
                            {element.tag.name}
                          </span>
                          <BsXLg
                            size={14}
                            onClick={() => OnHandleRemoveModalSkill(element, level)}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      );
                    })}
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
