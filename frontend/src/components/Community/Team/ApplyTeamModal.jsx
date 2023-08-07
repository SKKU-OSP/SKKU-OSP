import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Select from 'react-select';

const InviteTeamModal = () => {
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show, setShow] = useState(false);

  const options = [];
  return (
    <>
      <Button variant="outline-secondary" onClick={handleShow}>
        지원하기
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>지원하기</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
            <div className='mb-2'>지원하는 팀: ChatGPT 개발자 되기</div>
            <div className='mb-2'>ChatGPT API를 이용하여 다양한 응용 소프트웨어를 개발하고, 개발 경험을 공유합니다.</div>
            <div className='mb-2'>지원자 정보: hsh200315</div>

          <Form.Group className="mb-3" controlId="InviteMessage">
            <Form.Label>지원 동기</Form.Label>
            <Form.Control as="textarea" rows={3} style={{ display: 'block' }} placeholder="지원 동기를 작성해주세요." />
          </Form.Group>
          <div className='mb-2 d-flex flex-row'>
            <div className='me-1'>지원 시 지원한 팀의 사용자 프로필 열람에 동의합니다.</div>
            <input type="checkbox" />
          </div>
          
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-dark" onClick={handleClose}>
            지원하기
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InviteTeamModal;
