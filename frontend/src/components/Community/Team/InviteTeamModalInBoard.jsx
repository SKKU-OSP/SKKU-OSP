import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Select from 'react-select';
import axios from 'axios';

import { getAuthConfig } from '../../../utils/auth';

const serverUrl = import.meta.env.VITE_SERVER_URL;
const InviteTeamModalInBoard = (props) => {
  const postUrl = serverUrl + '/team/api/team-invite-on-teamboard';
  const handleClose = () => props.setShow(false);
  const handleShow = () => props.setShow(true);
  const team__id = props.id;
  //AXIOS GET
  const [users, setUsers] = useState([]);

  useEffect(() => {
    try {
      const getData = async () => {
        const teamMemList = serverUrl + '/team/api/team-invite-on-teamboard' + '?team_id=' + `${team__id}`;
        const response = await axios.get(teamMemList, getAuthConfig());
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
  }, []);

  const [userId, setUserId] = useState(0);
  const [message, setMessage] = useState('');

  const onChangeMessage = (e) => {
    const value = e.target.value;
    setMessage(value);
  };

  const [formData, setFormData] = useState({
    target_user_id: 318,
    target_team_id: 0,
    invite_msg: ''
  });

  const handleChooseUser = (target) => {
    setUserId(target.value);
    setFormData((prev) => {
      const newData = prev;
      newData['target_team_id'] = props.id;
      newData['target_user_id'] = target.value;
      return newData;
    });
  };

  const sendInvitation = async () => {
    console.log(formData);
    try {
      const response = await axios.post(postUrl, formData, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        console.log(res.errors);
      } else {
        alert('성공적으로 초대하였습니다.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData((prev) => {
      const newData = prev;
      newData['target_user_id'] = userId;
      newData['invite_msg'] = message;
      console.log(newData);
      return newData;
    });
    sendInvitation();
    handleClose();
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
            <span style={{ display: 'block' }}>초대할 팀원 선택</span>
            {users.map((u) => u.labels)}
            <Select
              placeholder="팀 선택"
              options={users}
              id="team_id"
              name="team_id"
              value={users.filter((user) => user.value === userId)}
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
