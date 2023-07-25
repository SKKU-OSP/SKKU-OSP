import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const ConsentsModal = ({ consents }) => {
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show, setShow] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={handleShow}>
        개인정보 이용내역 동의 <span className="text-danger">*</span>
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <h5>개인정보 이용내역 동의 설정</h5>
          <br />
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">서비스 사용에 동의하지 않으면 일부 서비스 사용이 제한됩니다.</div>
          {consents.map((consent) => {
            return (
              <>
                <Button variant="secondary" className="mb-3">
                  {consent.title}
                  <span className="text-danger">*</span>
                </Button>
                <div className="border rounded mb-5">
                  {consent.body.map((body) => {
                    return (
                      <>
                        <div className="mb-3">{body}</div>
                      </>
                    );
                  })}
                </div>
              </>
            );
          })}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConsentsModal;
