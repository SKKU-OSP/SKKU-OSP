import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';

const InviteTeamModal = () => {
    //AXIOS GET
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    const teamApplyUrl = serverUrl + '/team/api/team-apply/191';

    const [description, setDescription] = useState('');
    const [teamName, setTeamName] = useState('');
    const [checkBox, setCheckBox] = useState(0);

    const onChangeCheckBox = () => {
        checkBox === 0 ? setCheckBox(1) : setCheckBox(0);
    }

    useEffect(() => {
        try{
            const getData = async () =>{
                const response = await axios.get(teamApplyUrl,getAuthConfig());
                const res = response.data;
                if(res.status == 'success') {
                    setDescription(res.data.team.description);
                }
                if(res.status == 'success'){
                    setTeamName(res.data.team.name)
                }
            }
            getData();  
        }catch(error){
            console.log('error',error);
        }
    })

    const destinationUrl = 'http://127.0.0.1:8000/team/api/team-apply/191'
    //AXIOS POST
    const [message,setMessage] = useState('');
    const sendApplyTeam = async() => {
        console.log(message)
        try{
            const data = {message: message}
            const response = await axios.post(destinationUrl, data, getAuthConfig());
            const res = response.data;
            if(res.status === 'fail'){
                console.log(res.status, res.errors);
            }
            else{
                console.log(res.data);
                alert('성공적으로 팀에 지원했습니다.')
            }
        }catch(error){
            console.log(error);
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if(checkBox === 0){
            alert("동의해주세요.")
        }
        else{
            sendApplyTeam();
            setCheckBox(0);
            handleClose();
        }
        
    }

    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShow(true);
        setCheckBox(0);
    }
    const [show, setShow] = useState(false);

    const onChangeMessage = (e) => {
        const value = e.target.value;
        setMessage(value);
        console.log(message)
    }

    return (
    <Form> 
        <Button variant="outline-secondary" onClick={handleShow}>
        지원하기
        </Button>
        <Modal size='lg' show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>
            <h5>지원하기</h5>
            </Modal.Title>
        </Modal.Header>

        <Modal.Body>
            <div className='mb-2'>지원하는 팀: {teamName}</div>
            <div className='mb-2'>{description}</div>
            <div className='mb-2'>지원자 정보: hsh200315</div>

            <Form.Group className="mb-3" controlId="InviteMessage">
                <Form.Label>지원 동기</Form.Label>
                <Form.Control as="textarea" rows={3} style={{ display: 'block' }} placeholder="지원 동기를 작성해주세요." onChange={onChangeMessage} />
            </Form.Group>
            <div className='mb-2 d-flex flex-row'>
            <div className='me-1'>지원 시 지원한 팀의 사용자 프로필 열람에 동의합니다.</div>
                <input type="checkbox" onChange={onChangeCheckBox} />
            </div>
        </Modal.Body>

        <Modal.Footer>
            <Button variant="outline-dark" onClick={handleSubmit} type='submit'>
                지원하기
            </Button>
        </Modal.Footer>
    </Modal>
    </Form>
);
};

export default InviteTeamModal;
