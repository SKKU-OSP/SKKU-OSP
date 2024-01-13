import { useState } from 'react';

import axios from 'axios';

import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import classes from './LoginErrorModal.module.css';

const LoginErrorModal = (props) => {
  const { show, onShowLoginErrorModal, error } = props;

  const handleClose = () => onShowLoginErrorModal(false);

  return (
    <>
      <Form>
        <Modal show={show} onHide={handleClose} centered>
          <Modal.Header closeButton className={classes.modalTitle}>
            <Modal.Title>
              <h5>로그인 오류</h5>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className={classes.modalBody}>
            <h5>{error}</h5>
            <Button
              variant="outline-dark"
              size="sm"
              style={{ marginTop: '12px', backgroundColor: '#072a60', color: 'white' }}
              onClick={handleClose}
            >
              확인
            </Button>
          </Modal.Body>
        </Modal>
      </Form>
    </>
  );
};

export default LoginErrorModal;
