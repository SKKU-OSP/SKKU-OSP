import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Select from 'react-select';
import { BsPencilFill } from 'react-icons/bs';

const EditTeamModal = (props) => {
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show, setShow] = useState(false);
  const { team_name, team_desc, team_img, team_members, team_tags } = props;
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
      <BsPencilFill onClick={handleShow}/>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>팀 정보 수정</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-4" controlId="TeamName">
            <Form.Label>팀 이름</Form.Label>
            <Form.Control type="text" style={{ display: 'block' }} value={team_name} />
          </Form.Group>

          <Form.Group className="mb-4" controlId="TeamExplain">
            <Form.Label>팀 설명</Form.Label>
            <Form.Control as="textarea" rows={3} style={{ display: 'block' }} value={team_desc} />
          </Form.Group>

          <Form.Group className="mb-4" controlId="TeamImg">
            <Form.Label>팀 대표 이미지</Form.Label>
            <div style={{ fontSize: 'small', color: 'gray', marginBottom: '10px' }}>
              png,jpg,jpeg 확장자만 지원합니다
            </div>
            <Form.Control type="file" accept=".png, .jpg, .jpeg" multiple style={{ display: 'block' }} />
          </Form.Group>

          <div className="mb-4">
            <span style={{ display: 'block' }}>이미지 미리보기</span>
            <img width="80px" height="80px" src={team_img} alt="img" />
          </div>

          <Form.Group className="mb-4" controlId="TeamMember">
            <Form.Label>팀 멤버</Form.Label>
            <Form.Control type="textarea" value={team_members} />
          </Form.Group>
          
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

export default EditTeamModal;
