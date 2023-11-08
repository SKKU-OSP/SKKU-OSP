import { useEffect, useRef, useState } from 'react';

import axios from 'axios';
import Select from 'react-select';

import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { BsAwardFill, BsPencilFill, BsTrash } from 'react-icons/bs';

import { getAuthConfig } from '../../../utils/auth';

const serverUrl = import.meta.env.VITE_SERVER_URL;

const EditTeamModal = (props) => {
  const team = props.team;
  const [show, setShow] = useState(false);
  const [teamName, setTeamName] = useState(team?.name);
  const [teamDesc, setTeamDesc] = useState(team?.description);
  const [teamImg, setTeamImg] = useState(team?.image);
  const [teamMembers, setTeamMembers] = useState(() => {
    if (props.teamMembers) {
      return props.teamMembers.map((t) => {
        return { id: t.member.user.id, name: t.member.user.username, isAdmin: t.is_admin };
      });
    } else return [];
  });
  const [selectedTags, setSelectedTags] = useState(() => {
    if (props.teamTags) {
      return props.teamTags.map((t) => {
        return { value: t.name, label: t.name, color: t.color };
      });
    } else return [];
  });

  const [tags, setTags] = useState([]);
  const editorRef = useRef(null);

  const [originalTeamName, setOriginalTeamName] = useState('');
  const [originalTeamDesc, setOriginalTeamDesc] = useState('');
  const [originalTeamImg, setOriginalTeamImg] = useState('');
  const [originalTeamMembers, setOriginalTeamMembers] = useState([]);
  const [originalSelectedTags, setOriginalSelectedTags] = useState([]);

  const handleClose = () => {
    setTeamName(originalTeamName);
    setTeamDesc(originalTeamDesc);
    setTeamImg(originalTeamImg);
    setTeamMembers(originalTeamMembers);
    setSelectedTags(originalSelectedTags);
    setShow(false);
  };

  const handleShow = () => {
    setOriginalTeamName(teamName);
    setOriginalTeamDesc(teamDesc);
    setOriginalTeamImg(teamImg);
    setOriginalTeamMembers(teamMembers);
    setOriginalSelectedTags(selectedTags);
    setShow(true);
  };

  useEffect(() => {
    try {
      const getTag = async () => {
        const urlTag = serverUrl + '/tag/api/list/';
        const responseTag = await axios.get(urlTag);

        const resTag = responseTag.data;
        if (resTag.status === 'success') {
          setTags(
            resTag.data.tags.map((t) => {
              return {
                value: t.name,
                label: t.name,
                color: t.color
              };
            })
          );
        } else {
          console.log(resTag.message);
        }
      };
      getTag();
    } catch (error) {
      console.log('error', error);
    }
  }, []);

  const handleSave = async () => {
    const urlEditTeamInfo = serverUrl + '/team/api/team-update/';

    if (editorRef.current) {
      try {
        if (window.confirm('팀 정보를 수정하시겠습니까?')) {
          const config = getAuthConfig();
          config.headers['Content-Type'] = 'multipart/form-data';
          console.log('config', config);

          const postData = {
            target_team_id: team.id,
            team_name: teamName,
            team_description: teamDesc,
            team_image: teamImg,
            team_members: teamMembers.map((m) => m.name),
            team_tags: selectedTags.map((t) => t.value),
            team_admin: teamMembers.filter((m) => m.isAdmin).map((m) => m.name)
          };

          const response = await axios.post(urlEditTeamInfo, postData, getAuthConfig());
          const res = response.data;
          console.log(res);

          if (res.status === 'success') {
            alert('수정이 완료되었습니다!');
            handleClose();
          } else {
            alert('팀 업데이트에 실패했습니다.');
            console.log(res.message);
          }
        }
      } catch (error) {
        console.error('서버 요청 실패:', error);
      }
    }
  };

  const handelNameChange = (e) => {
    setTeamName(e.target.value);
  };
  const handelDescChange = (e) => {
    setTeamDesc(e.target.value);
  };

  const handleRemoveMember = (memberId) => {
    const updatedMembers = teamMembers.filter((member) => member.id !== memberId);
    setTeamMembers(updatedMembers);
    console.log('team', teamMembers);
  };

  const handleTagChange = (selectedOptions) => {
    setSelectedTags(selectedOptions);
  };
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? 'lightgray' : 'black',
      background: 'none'
    }),
    multiValue: (provided, state) => {
      const tagColor = state.data.color;

      if (tagColor) {
        const hexColor = tagColor.substring(1);
        const r = parseInt(hexColor.substring(0, 2), 16) & 0xff;
        const g = parseInt(hexColor.substring(2, 4), 16) & 0xff;
        const b = parseInt(hexColor.substring(4, 6), 16) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const fontColor = luma < 127.5 ? 'white' : 'black';

        return {
          ...provided,
          backgroundColor: tagColor,
          color: fontColor
        };
      }
    },
    multiValueLabel: (provided, state) => {
      const tagColor = state.data.color;

      if (tagColor) {
        const hexColor = tagColor.substring(1);
        const r = parseInt(hexColor.substring(0, 2), 16) & 0xff;
        const g = parseInt(hexColor.substring(2, 4), 16) & 0xff;
        const b = parseInt(hexColor.substring(4, 6), 16) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const fontColor = luma < 127.5 ? 'white' : 'black';

        return {
          ...provided,
          backgroundColor: tagColor,
          color: fontColor
        };
      }
    }
  };

  return (
    <>
      <BsPencilFill className="btnIcon" onClick={handleShow} />
      <Modal show={show} onHide={handleClose} ref={editorRef} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>팀 정보 수정</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-4" controlId="TeamName">
            <Form.Label>팀 이름</Form.Label>
            <Form.Control type="text" style={{ display: 'block' }} value={teamName} onChange={handelNameChange} />
          </Form.Group>

          <Form.Group className="mb-4" controlId="TeamExplain">
            <Form.Label>팀 설명</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              style={{ display: 'block' }}
              value={teamDesc}
              onChange={handelDescChange}
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="teamImg">
            <Form.Label>팀 대표 이미지</Form.Label>
            <div style={{ fontSize: 'small', color: 'gray', marginBottom: '10px' }}>
              png,jpg,jpeg 확장자만 지원합니다
            </div>
            <Form.Control
              type="file"
              accept=".png, .jpg, .jpeg"
              multiple
              style={{ display: 'block' }}
              onChange={(e) => setTeamImg(e.target.files[0])}
            />
          </Form.Group>

          <div className="mb-4">
            <span style={{ display: 'block' }}>이미지 미리보기</span>
            <img
              width="80px"
              height="80px"
              src={teamImg instanceof File ? URL.createObjectURL(teamImg) : teamImg}
              alt="img"
            />
          </div>

          <Form.Group className="mb-4" controlId="TeamMember">
            <Form.Label>팀 멤버</Form.Label>
            <ul>
              {teamMembers.map((member) => (
                <li key={member.id} className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {member.isAdmin ? <BsAwardFill /> : <BsAwardFill style={{ color: 'lightgray' }} />}
                    <span className="ml-2">{member.name}</span>
                  </div>
                  <button type="button" className="btn ml-2" onClick={() => handleRemoveMember(member.id)}>
                    <BsTrash />
                  </button>
                </li>
              ))}
            </ul>
          </Form.Group>

          <div className="mb-4">
            <span style={{ display: 'block' }}>팀 분야</span>
            <Select
              placeholder={'Tag'}
              isMulti
              options={tags}
              menuPlacement="auto"
              value={selectedTags}
              onChange={handleTagChange}
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              styles={customStyles}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleSave}>
            저장
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditTeamModal;
