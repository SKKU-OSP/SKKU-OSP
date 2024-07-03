import { useEffect, useState } from 'react';
import '../../User.css';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';

function QnAModal(props) {
  const { Show, OnHandleQnAClose, OnHandleQnASaveClose, myQnA } = props;
  const [modalQnA, setModalQnA] = useState(myQnA || { title: '', content: '' });
  const [contentLength, setContentLength] = useState(0);

  useEffect(() => {
    setModalQnA(myQnA || { title: '', content: '' });
    setContentLength(myQnA?.content.length || 0);
  }, [Show, myQnA]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModalQnA({
      ...modalQnA,
      [name]: value
    });
    if (name === 'content') {
      setContentLength(value.length);
    }
  };

  const handleSelectChange = (selectedOption) => {
    setModalQnA({
      ...modalQnA,
      type: selectedOption.value
    });
  };

  const handleSave = async () => {
    try {
      const adminUserId = 1; // admin user id
      const messageContent = `[${options.find((option) => option.value === modalQnA.type)?.label}] ${modalQnA.content}`;
      const server_url = import.meta.env.VITE_SERVER_URL;
      const url = `${server_url}/message/api/chat/${adminUserId}/`;

      const response = await axios.post(url, { 'chat-input': messageContent }, getAuthConfig());

      if (response.status === 200) {
        OnHandleQnASaveClose(modalQnA);
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const options = [
    { value: 'inquiry', label: '이용 문의' },
    { value: 'bug', label: '오류 신고' },
    { value: 'suggestion', label: '서비스 제안' },
    { value: 'other', label: '기타' }
  ];

  return (
    <Modal size="lg" show={Show} onHide={OnHandleQnAClose}>
      <Modal.Header closeButton>
        <Modal.Title>문의하기</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="qnaType">
            <Form.Label>질문 유형</Form.Label>
            <Select
              name="type"
              value={options.find((option) => option.value === modalQnA.type)}
              onChange={handleSelectChange}
              options={options}
              placeholder="질문 유형을 선택해주세요"
            />
          </Form.Group>
          <Form.Group controlId="qnaContent" className="mt-3">
            <Form.Label>내용</Form.Label>
            <Form.Control
              as="textarea"
              name="content"
              value={modalQnA.content}
              onChange={handleInputChange}
              placeholder="내용을 입력해주세요"
              rows={5}
              className="custom-textarea"
            />
            <div className="text-end mt-1">
              <small>{contentLength} / 500</small>
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
        <small className="text-muted">
          * 휴일을 제외한 평일에는 하루 이내에 답변 드리겠습니다. 답변은 SOSD 메시지함을 확인해주세요.
        </small>
        <Button variant="outline-dark" onClick={handleSave}>
          제출
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default QnAModal;
