import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Select from 'react-select';
import { BsFillPersonPlusFill } from 'react-icons/bs';

const InviteTeamModal = () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    const teamListUrl = serverUrl + '/team/api/team-invite-on-recommend'
    const postUrl = serverUrl + '/team/api/team-invite-on-teamboard';
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show, setShow] = useState(false);

  //AXIOS GET
  const [teams,setTeams] = useState([]);

  useEffect(() => {
    try{
        const getData = async () => {
            const response = await axios.get(teamListUrl,getAuthConfig());
            const res = response.data;
            console.log(res)
            if(res.status === 'success'){
                setTeams(
                    res.data.teams_of_user.map((team) => {
                        return { value: team.id, label: team.name}
                    })
                )
            }
        }
        getData();
    }catch(error){
        console.log('error', error)
    }
  },[]);

  const [teamId, setTeamId] = useState(0);
  const [message,setMessage] = useState('');

  const onChangeMessage = (e) => {
    const value = e.target.value;
    setMessage(value);
}

  const [formData, setFormData] = useState({
    target_user_id: 318,
    target_team_id: 0,
    invite_msg: ''  
  })

  const handleInviteTeam = (target) => {
    setTeamId(target.value);
    setFormData((prev) => {
        const newData = prev;
        newData['target_team_id'] = target.value;
        return newData;
    });
  }

  const sendInvitation = async () => {
    console.log(formData)
    try{
        const response = await axios.post(postUrl,formData,getAuthConfig())
        const res = response.data;
        if(res.status === 'fail') {
            console.log(res.errors);
        }
        else{
            alert('성공적으로 초대하였습니다.');
        }
    }catch(error){
        console.log(error)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData((prev) => {
      const newData = prev;
      newData['target_team_id'] = teamId;
      newData['invite_msg'] = message;
      console.log(newData);
      return newData;
    });
    sendInvitation();
    handleClose();
  };
  return (
    <>
      <BsFillPersonPlusFill onClick={handleShow}/>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>팀 초대하기</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-4" controlId="MemberName">
            <Form.Label>팀원</Form.Label>
            <Form.Control type="text" style={{ display: 'block' }} />
          </Form.Group>

          <div className="mb-4">
            <span style={{ display: 'block' }}>초대할 팀 선택</span>
            <Select placeholder="팀 선택" options={teams} id='team_id' name='team_id' value={teams.filter(function (option){
                return option.value === teamId;
            })} onChange={handleInviteTeam} />
        </div>

          <Form.Group className="mb-4" controlId="InviteMessage">
            <Form.Label>초대 메세지</Form.Label>
            <Form.Control as="textarea" rows={3} style={{ display: 'block' }} placeholder="초대 인사를 입력하세요." onChange={onChangeMessage}/>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleSubmit} type='submit'>
            초대 메세지 보내기
          </Button>
        </Modal.Footer>
      </Modal>
    </Form>
  );
};

export default InviteTeamModal;
