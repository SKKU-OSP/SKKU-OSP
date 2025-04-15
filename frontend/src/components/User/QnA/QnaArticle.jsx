import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';
import '../User.css';

const server_url = import.meta.env.VITE_SERVER_URL;

const QnAArticle = (props) => {
  const { qna, Show, handleClose } = props;
  const [response, setResponse] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [qnaDetails, setQnaDetails] = useState(null);

  useEffect(() => {
    if (Show && qna.id) {
      fetchQnaDetails();
    }
  }, [Show, qna.id]);

  const fetchQnaDetails = async () => {
    try {
      const response = await axios.get(`${server_url}/user/api/qna/${qna.id}/`, getAuthConfig());
      setQnaDetails(response.data.data);
      setResponse(response.data.data.response || '');
    } catch (error) {
      console.error('Error fetching QnA details:', error);
    }
  };

  const handleResponseChange = (e) => {
    setResponse(e.target.value);
  };

  const handleResponseSubmit = async () => {
    try {
      const messageData = {
        'chat-input': `[문의 답변] 문의하신 내용에 대한 답변이 등록되었습니다.\n\n${response}`
      };
      const messageResponse = await axios.post(
        `${server_url}/message/api/chat/${qnaDetails.user_id}/`,
        messageData,
        getAuthConfig()
      );

      if (messageResponse.status === 200) {
        const updateQnaData = {
          solved: true,
          response: response
        };
        const updateQnaResponse = await axios.patch(
          `${server_url}/user/api/qna/${qna.id}/`,
          updateQnaData,
          getAuthConfig()
        );

        if (updateQnaResponse.status === 200) {
          console.log('QnA solved updated successfully');
        } else {
          console.error('Failed to update QnA solved');
        }

        console.log('Response submitted:', response);
        handleClose();
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const handleResponseUpdate = async () => {
    try {
      const messageData = {
        'chat-input': `[문의 답변 수정] 문의하신 내용에 대한 답변이 수정되었습니다.\n\n${response}`
      };
      const messageResponse = await axios.post(
        `${server_url}/message/api/chat/${qnaDetails.user_id}/`,
        messageData,
        getAuthConfig()
      );

      if (messageResponse.status === 200) {
        const updateQnaData = { response: response };
        const updateResponse = await axios.patch(
          `${server_url}/user/api/qna/${qna.id}/`,
          updateQnaData,
          getAuthConfig()
        );

        if (updateResponse.status === 200) {
          console.log('QnA response updated successfully');
        } else {
          console.error('Failed to update QnA response');
        }

        console.log('Response submitted:', response);
        handleClose();
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error updating response:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleImageModalClose = () => {
    setSelectedImage(null);
  };

  return (
    <Modal show={Show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>문의 상세 내용</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {qna ? (
          <div>
            <div className="qna-details">
              <div className="qna-details-left">
                <div className="mb-3">
                  <span className="qna-details-font"> 접수일 </span>
                  {formatDate(qna.created_at)}
                </div>
                <div className="mb-3">
                  <span className="qna-details-font">문의 번호 </span> {qna.id}
                </div>
              </div>
              <div className="qna-details-right">
                <div className="mb-3">
                  <span className="qna-details-font">작성자 ID </span> {qna.user}
                </div>
                <div className="mb-3">
                  <span className="qna-details-font">해결 여부 </span> {qna.solved ? '완료' : '미완료'}
                </div>
              </div>
            </div>
            <div className="divider" style={{ marginBottom: '15px' }}></div>
            <div>
              <Form.Label>
                <span className="qna-details-font">문의 내용 </span>
              </Form.Label>
              <p>{qna.content}</p>
            </div>
            {qna.images && qna.images.length > 0 && (
              <div className="qna-attachments">
                <span className="qna-details-font">첨부 파일 </span>
                <div className="qna-attachment">
                  {qna.images.map((file, index) => (
                    <img
                      key={index}
                      src={`${server_url}/data/media/qna_images/${file.name}`}
                      alt={`첨부파일 ${index + 1}`}
                      onClick={() => handleImageClick(file)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="mb-3">
              <Form.Control
                as="textarea"
                value={response}
                onChange={handleResponseChange}
                placeholder="답변내용을 입력해주세요"
                rows={5}
                className="form-control"
              />
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {qnaDetails && qnaDetails.solved ? (
          <Button variant="outline-dark" onClick={handleResponseUpdate}>
            답변 수정
          </Button>
        ) : (
          <Button variant="outline-dark" onClick={handleResponseSubmit}>
            답변 등록
          </Button>
        )}
      </Modal.Footer>
      {selectedImage && (
        <Modal show={true} onHide={handleImageModalClose} size="lg">
          <Modal.Body className="qna-attachment-modal">
            <img src={`${server_url}/data/media/qna_images/${selectedImage.name}`} alt="원본 이미지" />
          </Modal.Body>
        </Modal>
      )}
    </Modal>
  );
};

export default QnAArticle;
