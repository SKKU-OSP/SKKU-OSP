import React, { useState, useRef, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const GithubLoginModal = (props) => {
  const { show, onShowGithubLoginModal, onSubmitGithubId } = props;
  const [studentId, setStudentId] = useState('');
  const [githubId, setGithubId] = useState('');
  const [error, setError] = useState(null);
  const githubInputRef = useRef();

  const handleClose = () => onShowGithubLoginModal(false);

  const handleSubmit = () => {
    onSubmitGithubId(studentId, githubId);
    onShowGithubLoginModal(false);
  };

  useEffect(() => {
    if (show) {
      setStudentId('');
      setGithubId('');
      setError(null);
    }
  }, [show]);

  return (
    <>
      <Form>
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>GitHub ID 변경</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>학번</Form.Label>
              <Form.Control
                type="text"
                placeholder="학번을 입력하세요"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>GitHub ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="GitHub ID를 입력하세요"
                value={githubId}
                onChange={(e) => setGithubId(e.target.value)}
                ref={githubInputRef}
                required
              />
            </Form.Group>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              닫기
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              변경
            </Button>
          </Modal.Footer>
        </Modal>
      </Form>
    </>
  );
};

export default GithubLoginModal;
