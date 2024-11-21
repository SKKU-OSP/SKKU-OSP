import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const GithubLoginModal = (props) => {
  const { show, onClose, onSubmitGithubId } = props;
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [githubId, setGithubId] = useState('');
  const [error, setError] = useState(null);
  const githubInputRef = useRef();

  const handleClose = () => {
    onClose(false);
    navigate(`/accounts/login`);
  };

  const handleSubmit = () => {
    if (!studentId || !githubId) {
      setError('학번과 GitHub ID를 모두 입력해주세요.');
      return;
    }

    onSubmitGithubId(studentId, githubId);
    onClose(false);
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
                placeholder="학번을 입력해주세요"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>GitHub ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="변경하고자 하는 GitHub ID를 입력해주세요"
                value={githubId}
                onChange={(e) => setGithubId(e.target.value)}
                ref={githubInputRef}
                required
              />
            </Form.Group>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleSubmit}>
              변경
            </Button>
            <Button variant="secondary" onClick={handleClose}>
              취소
            </Button>
          </Modal.Footer>
        </Modal>
      </Form>
    </>
  );
};

export default GithubLoginModal;
