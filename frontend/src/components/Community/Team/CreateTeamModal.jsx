import { useEffect, useRef, useState } from 'react';

import axios from 'axios';
import Select from 'react-select';

import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { getAuthConfig } from '../../../utils/auth';
import { useNavigate } from 'react-router-dom';

const domainUrl = import.meta.env.VITE_SERVER_URL;
const CreateTeamModal = ({ show, onClose }) => {
  const postCreateUrl = domainUrl + '/team/api/team-create/';

  const [options, setOptions] = useState([]);
  const [imgFile, setImgFile] = useState('');
  const [selectTags, setSelectTags] = useState([]);
  const [teamNameTag, setTeamNameTag] = useState("팀 이름")
  const [descTag, setDescTag] = useState("팀 설명")
  const [imgTag, setImgTag] = useState("팀 대표 이미지")

  const teamnameInputRef = useRef();
  const teamdescriptionInputRef = useRef();
  const teamImgRef = useRef();

  const navigate = useNavigate();

  useEffect(() => {
    const getTag = async () => {
      const urlTag = domainUrl + '/tag/api/list/';
      const responseTag = await axios.get(urlTag);

      const resTag = responseTag.data;
      if (resTag.status === 'success') {
        setOptions(
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
  }, []);

  const postCreateTeam = async () => {
    try {
      const postData = {
        team_name: teamnameInputRef.current.value,
        team_description: teamdescriptionInputRef.current.value,
        team_image: teamImgRef.current.files[0],
        team_tag: selectTags
      };
      const formData = new FormData();
      if (teamnameInputRef.current.value === '') {
        setTeamNameTag("팀 이름 (팀 이름은 필수 값입니다!)")
        return
      }
      else{
        setTeamNameTag("팀 이름")
      }
      if(teamdescriptionInputRef.current.value === ''){
        setDescTag("팀 설명 (팀 설명은 필수 값입니다!)")
        return;
      } 
      else{
        setDescTag("팀 설명")
      }
      Object.entries(postData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      const response = await axios.post(postCreateUrl, formData, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        if(res.errors["team_name_duplicate"])
          setTeamNameTag("팀 이름 (" + res.errors["team_name_duplicate"] + ")")

        if(res.errors["team_description_length"])
          setDescTag("팀 설명 (" + res.errors["team_description_length"] + ")")

        if(res.errors["team_description_duplicate"])
          setDescTag("팀 설명 (" + res.errors["team_description_duplicate"] + ")")

        if(res.errors["team_image_too_big"])
          setDescTag("팀 대표 이미지 (" + res.errors["team_description_duplicate"] + ")")

      } else {
        onClose();
        alert("팀이 성공적으로 만들어졌습니다!")
        navigate(`/community/team/${postData.team_name}`);
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleSaveClick = () => {
    postCreateTeam();
  };

  const saveImgFile = () => {
    const file = teamImgRef.current.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImgFile(reader.result);
    };
  };

  const handleSelectTag = (selectTags) => {
    setSelectTags(selectTags.map((tag) => tag.value));
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <h5>팀 만들기</h5>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group className="mb-4" controlId="TeamName">
          <Form.Label>{teamNameTag}</Form.Label>
          <Form.Control ref={teamnameInputRef} type="text" style={{ display: 'block' }} />
        </Form.Group>
        <Form.Group className="mb-4" controlId="TeamExplain">
          <Form.Label>{descTag}</Form.Label>
          <Form.Control ref={teamdescriptionInputRef} as="textarea" rows={3} style={{ display: 'block' }} />
        </Form.Group>

        <Form.Group className="mb-4" controlId="TeamImg">
          <Form.Label>{imgTag}</Form.Label>
          <div style={{ fontSize: 'small', color: 'gray', marginBottom: '10px' }}>png,jpg,jpeg 확장자만 지원합니다</div>
          <Form.Control
            ref={teamImgRef}
            onChange={saveImgFile}
            type="file"
            accept=".png, .jpg, .jpeg"
            multiple
            style={{ display: 'block' }}
          />
        </Form.Group>

        <div className="mb-4">
          <span style={{ display: 'block' }}>이미지 미리보기</span>
          <img width="80px" height="80px" src={imgFile ? imgFile : null} alt="img" />
        </div>
        <div className="mb-4">
          <span style={{ display: 'block' }}>팀 분야</span>
          <Select isMulti options={options} onChange={handleSelectTag} />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={handleSaveClick}>
          팀 만들기
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateTeamModal;
