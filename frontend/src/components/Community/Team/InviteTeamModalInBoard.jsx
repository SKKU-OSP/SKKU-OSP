import { useEffect, useState } from 'react';

import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';
import Select from 'react-select';

import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { getAuthConfig } from '../../../utils/auth';

const serverUrl = import.meta.env.VITE_SERVER_URL;
const InviteTeamModalInBoard = (props) => {
  const postUrl = serverUrl + '/team/api/team-invite-on-teamboard/';
  const handleClose = () => props.setShow(false);
  const teamId = props.id;
  //AXIOS GET
  const [users, setUsers] = useState([]);

  useEffect(() => {
    try {
      const getData = async () => {
        const userListUrl = `${serverUrl}/team/api/team-invite-on-teamboard/?team_id=${teamId}`;
        const response = await axiosInstance.get(userListUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setUsers(
            res.data.usernames_exclude_members.map((user) => {
              return { value: user.id, label: user.username };
            })
          );
        }
      };
      getData();
    } catch (error) {
      console.log('error', error);
    }
  }, [teamId]);

  const [targetUserId, setTargetUserId] = useState(0);
  const [message, setMessage] = useState('');

  const onChangeMessage = (e) => {
    const value = e.target.value;
    setMessage(value);
  };

  const handleChooseUser = (target) => {
    setTargetUserId(target.value);
  };

  const sendInvitation = async () => {
    if (targetUserId === 0) {
      alert('초대할 팀원을 선택해주세요');
      return;
    }
    const formData = { target_user_id: targetUserId, target_team_id: teamId, invite_msg: message };

    try {
      const response = await axiosInstance.post(postUrl, formData, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        console.log(res.errors);
      } else {
        alert('성공적으로 초대하였습니다.');
      }
    } catch (error) {
      console.log(error);
    }
    handleClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendInvitation();
  };
  return (
    <Form>
      <Modal show={props.show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>팀 초대하기</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-4" controlId="MemberName">
            <Form.Label>팀 이름: {props.team_name}</Form.Label>
          </Form.Group>

          <div className="mb-4">
            <span style={{ display: 'block' }}>팀원</span>
            <Select
              placeholder="초대할 팀원 선택"
              options={users}
              id="team_id"
              name="team_id"
              value={users.filter((user) => user.value === targetUserId)}
              onChange={handleChooseUser}
            />
          </div>

          <Form.Group className="mb-4" controlId="InviteMessage">
            <Form.Label>초대 메세지</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              style={{ display: 'block' }}
              placeholder="초대 인사를 입력하세요."
              onChange={onChangeMessage}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleSubmit} type="submit">
            초대 메세지 보내기
          </Button>
        </Modal.Footer>
      </Modal>
    </Form>
  );
};

export default InviteTeamModalInBoard;
