import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Select from 'react-select';

const CreateTeamModal = () => {
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show, setShow] = useState(false);

  const options = [
    { value: 'Fastify', label: 'Fastify' },
    { value: 'Fastlane', label: 'Fastlane' },
    { value: 'Flask', label: 'Flask' },
    { value: 'Flink', label: 'Flink' },
    { value: 'Fluentd', label: 'Fluentd' },
    { value: 'Flutter', label: 'Flutter' }
  ];
  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        팀 만들기
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>팀 만들기</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-4" controlId="TeamName">
            <Form.Label>팀 이름</Form.Label>
            <Form.Control type="text" style={{ display: 'block' }} />
          </Form.Group>

          <Form.Group className="mb-4" controlId="TeamExplain">
            <Form.Label>팀 설명</Form.Label>
            <Form.Control as="textarea" rows={3} style={{ display: 'block' }} />
          </Form.Group>

          <Form.Group className="mb-4" controlId="TeamImg">
            <Form.Label>팀 대표 이미지</Form.Label>
            <div style={{ fontSize: 'small', color: 'gray', marginBottom: '10px' }}>
              png,jpg,jpeg 확장자만 지원합니다
            </div>
            <Form.Control type="file" multiple style={{ display: 'block' }} />
          </Form.Group>

          <div className="mb-4">
            <span style={{ display: 'block' }}>이미지 미리보기</span>
            <img width="80px" height="80px" src="../images/chunsik.webp" alt="img" />
          </div>
          <div className="mb-4">
            <span style={{ display: 'block' }}>팀 분야</span>
            <Select isMulti options={options} />
          </div>
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

export default CreateTeamModal;
