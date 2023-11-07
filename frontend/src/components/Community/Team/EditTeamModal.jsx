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
  const { team_name } = props;
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
  const [show, setShow] = useState(false);
  const [teamID, setTeamID] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamImg, setTeamImg] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const editorRef = useRef(null);

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
      const getData = async () => {
        const infoUrl = serverUrl + `/community/api/board/${team_name}`;
        const response = await axios.get(infoUrl, getAuthConfig());
        const res = response.data;
        console.log(res);
        if (res.status === 'success') {
          setTeamID(res.data.team.id);
          setTeamName(res.data.team.name);
          setTeamDesc(res.data.team.description);
          setTeamImg(res.data.team.image);
          setTeamMembers(
            res.data.team_members.map((t) => {
              return {
                id: t.member.user.id,
                name: t.member.user.username,
                isAdmin: t.is_admin
              };
            })
          );
          if (res.data.tags) {
            setSelectedTags(
              res.data.tags.map((t) => {
                return {
                  value: t.name,
                  label: t.name,
                  color: t.color
                };
              })
            );
          }
        }
      };
      getTag();
      getData();
    } catch (error) {
      console.log('error', error);
    }
  }, [team_name]);

  const handleSave = async () => {
    const urlEditTeamInfo = serverUrl + '/team/api/team-update/';

    if (editorRef.current) {
      try {
        if (window.confirm('글을 수정하시겠습니까?')) {
          const config = getAuthConfig();
          config.headers['Content-Type'] = 'multipart/form-data';
          console.log('config', config);

          const postData = {
            target_team_id: teamID,
            team_name: teamName,
            team_description: teamDesc,
            team_image: teamImg
            // team_members: teamMembers,
            // team_tags: selectedTags
            // team_admin 정보도 넘길것
          };

          const formData = new FormData();
          Object.entries(postData).forEach(([key, value]) => {
            console.log('keyvalue', key, typeof value);
            if (key === 'team_tags') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value);
            }
          });

          console.log('postData', postData);
          for (let key of formData) {
            console.log('key', key, formData[key]);
          }
          const response = await axios.post(urlEditTeamInfo, formData, getAuthConfig());

          const res = response.data;
          console.log(res);

          if (res.status === 'success') {
            window.alert('수정이 완료되었습니다!');
            handleClose();
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
      <BsPencilFill onClick={handleShow} />
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
