import { useEffect, useState } from 'react';
import '../../User.css';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;

function QnAModal(props) {
  const { user, Show, OnHandleQnAClose, OnHandleQnASaveClose } = props;
  const [modalQnA, setModalQnA] = useState({ type: '', content: '', image: [] });
  const [contentLength, setContentLength] = useState(0);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    setModalQnA({ type: '', content: '', image: [] });
    setContentLength(0);
    setImages([]);
    setImagePreviews([]);
  }, [Show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'content') {
      if (value.length > 500) {
        alert('내용은 최대 500자까지 입력할 수 있습니다.');
        return;
      }
      setContentLength(value.length);
    }
    setModalQnA({
      ...modalQnA,
      [name]: value
    });
  };

  const handleSelectChange = (selectedOption) => {
    setModalQnA({
      ...modalQnA,
      type: selectedOption.value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      alert('최대 3개의 이미지만 업로드할 수 있습니다.');
      return;
    }

    const newImages = files.slice(0, 3 - images.length);
    const newImagePreviews = newImages.map((file) => URL.createObjectURL(file));

    setImages([...images, ...newImages]);
    setImagePreviews([...imagePreviews, ...newImagePreviews]);
  };

  const handleImageRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newImagePreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(newImages);
    setImagePreviews(newImagePreviews);
  };

  const handleShowQnA = (event) => {
    event.preventDefault();
    console.log('modal', modalQnA);

    if (modalQnA.type === '') {
      window.alert('질문 유형을 선택해 주세요');
      return;
    }

    if (modalQnA.content.trim() === '') {
      window.alert('내용을 입력해 주세요');
      return;
    }

    if (window.confirm('QnA를 등록하시겠습니까?')) {
      postQnA();
    }
  };

  const postQnA = async () => {
    try {
      const config = getAuthConfig();
      config.headers['Content-Type'] = 'multipart/form-data';

      const userName = user;
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}.${String(currentDate.getMonth() + 1).padStart(
        2,
        '0'
      )}.${String(currentDate.getDate()).padStart(2, '0')}`;

      const postData = {
        user: userName,
        type: modalQnA.type,
        content: modalQnA.content,
        created_at: formattedDate,
        solved: false
      };

      const formData = new FormData();
      Object.entries(postData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      images.forEach((image, index) => {
        formData.append(`image${index + 1}`, image);
      });

      const response = await axios.post(`${server_url}/user/api/qna/create/`, formData, config);

      if (response.status === 201) {
        window.alert('등록이 완료되었습니다!');
        OnHandleQnASaveClose(modalQnA);
      } else {
        window.alert('등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('에러:', error);
      window.alert('Error Occurred');
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
          <Form.Group controlId="qnaImages" className="mt-3">
            <Form.Label>이미지 업로드</Form.Label>
            <Form.Control type="file" multiple accept="image/*" onChange={handleImageChange} />
            <div className="image-previews mt-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={preview}
                    alt={`preview-${index}`}
                    className="img-thumbnail"
                    style={{ maxWidth: '150px', marginRight: '10px' }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ position: 'absolute', top: '5px', right: '15px' }}
                    onClick={() => handleImageRemove(index)}
                  >
                    X
                  </Button>
                </div>
              ))}
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
        <small className="text-muted">
          * 휴일을 제외한 평일에는 하루 이내에 답변 드리겠습니다. 답변은 SOSD 메시지함을 확인해주세요.
        </small>
        <Button variant="outline-dark" onClick={handleShowQnA}>
          제출
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default QnAModal;
