import React from 'react';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const LoginSelectModal = (props) => {
  const { show, onClose, onDirectLogin, onIdChange } = props;

  return (
    <>
      <Form>
        <Modal show={show} onHide={onClose}>
          <Modal.Header closeButton>
            <Modal.Title>Start with Github</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Label>GitHub로 로그인 하시겠습니까? 또는 GitHub ID를 변경하시겠습니까?</Form.Label>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={onDirectLogin}>
              GitHub 로그인
            </Button>
            <Button variant="secondary" onClick={onIdChange}>
              GitHub ID 변경
            </Button>
          </Modal.Footer>
        </Modal>
      </Form>
    </>
  );
};

export default LoginSelectModal;
