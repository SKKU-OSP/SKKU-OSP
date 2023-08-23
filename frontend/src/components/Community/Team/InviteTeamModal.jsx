import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Select from 'react-select';
import { BsFillPersonPlusFill } from 'react-icons/bs';

const InviteTeamModal = () => {
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show, setShow] = useState(false);

  const options = [];
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
            <Select placeholder="팀 선택" options={options} />
        </div>

          <Form.Group className="mb-4" controlId="InviteMessage">
            <Form.Label>초대 메세지</Form.Label>
            <Form.Control as="textarea" rows={3} style={{ display: 'block' }} placeholder="초대 인사를 입력하세요." />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            초대 메세지 보내기
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InviteTeamModal;
