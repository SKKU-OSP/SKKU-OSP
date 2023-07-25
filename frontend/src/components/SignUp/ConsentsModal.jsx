import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const ConsentsModal = ({ consents }) => {
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show, setShow] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        개인정보 동의
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton></Modal.Header>

        <Modal.Body>
          {consents.map((consent) => {
            return (
              <>
                <div>{consent.title}</div>
                <div>{consent.body}</div>
              </>
            );
          })}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            저장
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConsentsModal;
