import { useState } from 'react';

import axios from 'axios';

import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { getAuthConfig } from '../../../utils/auth';

const serverUrl = import.meta.env.VITE_SERVER_URL;
const ApplyTeamModal = (props) => {
  const { teamName, teamDesc, username, show, onShowTeamApplyModal, articleId } = props;
  const destinationUrl = `${serverUrl}/team/api/team-apply/${articleId}/`;
  const [checkBox, setCheckBox] = useState(0);
  const [message, setMessage] = useState('');

  const onChangeCheckBox = () => {
    checkBox === 0 ? setCheckBox(1) : setCheckBox(0);
  };
  //AXIOS POST
  const sendApplyTeam = async () => {
    console.log(message);
    try {
      const data = { message: message };
      const response = await axios.post(destinationUrl, data, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        console.log(res.status, res.errors);
      } else {
        console.log(res.data);
        alert('성공적으로 팀에 지원했습니다.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkBox === 0) {
      alert('동의해주세요.');
    } else {
      sendApplyTeam();
      setCheckBox(0);
      handleClose();
    }
  };

  const handleClose = () => onShowTeamApplyModal(false);

  const onChangeMessage = (e) => {
    const value = e.target.value;
    setMessage(value);
    console.log(message);
  };

  return (
    <>
      <Form>
        <Modal size="lg" show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>
              <h5>지원하기</h5>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="mb-2">지원하는 팀: {teamName}</div>
            <div className="mb-2">{teamDesc}</div>
            <div className="mb-2">지원자 정보: {username}</div>

            <Form.Group className="mb-3" controlId="InviteMessage">
              <Form.Label>지원 동기</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                style={{ display: 'block' }}
                placeholder="지원 동기를 작성해주세요."
                onChange={onChangeMessage}
              />
            </Form.Group>
            <div className="mb-2 d-flex flex-row">
              <div className="me-1">지원 시 지원한 팀의 사용자 프로필 열람에 동의합니다.</div>
              <input type="checkbox" onChange={onChangeCheckBox} />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-dark" onClick={handleSubmit} type="submit">
              지원하기
            </Button>
          </Modal.Footer>
        </Modal>
      </Form>
    </>
  );
};

export default ApplyTeamModal;
