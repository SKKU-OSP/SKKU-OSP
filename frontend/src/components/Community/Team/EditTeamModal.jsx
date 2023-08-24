import { useState , useEffect, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Select from 'react-select';
import { BsPencilFill } from 'react-icons/bs';
import axios from 'axios';

const EditTeamModal = (props) => {
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show, setShow] = useState(false);
  const { team_name, team_desc, team_img, team_members, team_tags } = props;
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamImg, setTeamImg] = useState();
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const editorRef = useRef(null);
  
  const options = [
    { value: 'Fastify', label: 'Fastify' },
    { value: 'Fastlane', label: 'Fastlane' },
    { value: 'Flask', label: 'Flask' },
    { value: 'Flink', label: 'Flink' },
    { value: 'Fluentd', label: 'Fluentd' },
    { value: 'Flutter', label: 'Flutter' }
  ];

  useEffect(() => {
    setTeamName(team_name);
    setTeamDesc(team_desc);
    setTeamImg(team_img);
    setTeamMembers(team_members);
    setSelectedTags(
      team_tags
    );
  })

  const handleSave = async () => {
    if (editorRef.current) {
      console.log("team", teamName, teamDesc, teamImg, teamMembers);

      // const response = await axios.post(
      //   urlEditArticle,
      //   {
      //   },
      //   getAuthConfig()
      // );
    }
    handleClose();
  };

  const handelNameChange = (e) => {setTeamName(e.target.value);};
  const handelDescChange = (e) => {setTeamDesc(e.target.value);};

  const handleTagChange = (selectedOptions) => {
    setSelectedTags(selectedOptions);
  };


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
            <Form.Control type="text" style={{ display: 'block' }} value={teamName} onChange={handelNameChange} />
          </Form.Group>

          <Form.Group className="mb-4" controlId="TeamExplain">
            <Form.Label>팀 설명</Form.Label>
            <Form.Control as="textarea" rows={3} style={{ display: 'block' }} value={teamDesc} onChange={handelDescChange} />
          </Form.Group>

          <Form.Group className="mb-4" controlId="TeamImg">
            <Form.Label>팀 대표 이미지</Form.Label>
            <div style={{ fontSize: 'small', color: 'gray', marginBottom: '10px' }}>
              png,jpg,jpeg 확장자만 지원합니다
            </div>
            <Form.Control type="file" accept=".png, .jpg, .jpeg" multiple style={{ display: 'block' }} onChange={(e) => setTeamImg(e.target.files[0])}/>
          </Form.Group>

          <div className="mb-4">
            <span style={{ display: 'block' }}>이미지 미리보기</span>
            <img width="80px" height="80px" src={teamImg instanceof File ? URL.createObjectURL(teamImg) : teamImg} alt="img"/>
          </div>

          <Form.Group className="mb-4" controlId="TeamMember">
            <Form.Label>팀 멤버</Form.Label>
            <Form.Control type="textarea" value={teamMembers} onChange={(e) => setTeamMembers(e.target.value)} />
          </Form.Group>
          
          <div className="mb-4">
            <span style={{ display: 'block' }}>팀 분야</span>
            <Select isMulti options={options} value={selectedTags} onChange={handleTagChange} />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleSave}>
            저장
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditTeamModal;
