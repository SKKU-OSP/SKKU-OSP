import { useState } from 'react';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';

const ConsentsModal = (props) => {
  const [modalOpen, setModalOpen] = useState(props.show);
  const handleModalClose = () => {
    setModalOpen(!modalOpen);
    props.changeModal(false);
  };

  const handleAcceptRadios = (number) => {
    if (number === 0) {
      props.changeRadioValue((prev) => {
        const newData = prev;
        newData['open_lvl'] = 1;
        props.changeMandatoryValue(true);
        props.changeConsentBtn('btn-primary');
        return newData;
      });
    }
    if (number === 1) {
      props.changeRadioValue((prev) => {
        const newData = prev;
        newData['is_write'] = 1;
        return newData;
      });
    }
    if (number === 2) {
      props.changeRadioValue((prev) => {
        const newData = prev;
        newData['is_open'] = 1;
        return newData;
      });
    }
  };
  const handleNotAcceptRadios = (number) => {
    if (number === 0) {
      props.changeRadioValue((prev) => {
        const newData = prev;
        newData['open_lvl'] = 0;
        props.changeMandatoryValue(false);
        props.changeConsentBtn('btn-danger');
        return newData;
      });
    }
    if (number === 1) {
      props.changeRadioValue((prev) => {
        const newData = prev;
        newData['is_write'] = 0;
        return newData;
      });
    }
    if (number === 2) {
      props.changeRadioValue((prev) => {
        const newData = prev;
        newData['is_open'] = 1;
        return newData;
      });
    }
  };

  const [open, setOpen] = useState(true);
  return (
    <>
      <Modal show={modalOpen} onHide={handleModalClose} size="xl">
        <Modal.Header closeButton>
          <h5>개인정보 이용내역 동의 설정</h5>
          <br />
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">서비스 사용에 동의하지 않으면 일부 서비스 사용이 제한됩니다.</div>
          {props.consents.map((consent, idx) => {
            return (
              <div key={`collapse-${idx}`}>
                <Button
                  variant="secondary"
                  className="mb-3"
                  onClick={() => setOpen(!open)}
                  aria-controls="example-collapse-text"
                  aria-expanded={open}
                >
                  {consent.title}
                  <span className="text-danger">*</span>
                </Button>
                <Collapse in={open}>
                  <div className="border rounded collapse m-0" id={`collapse-${idx}`}>
                    {consent.body.map((body, bodyidx) => {
                      return (
                        <div className=" mb-3" key={`body-${bodyidx}`}>
                          {body}
                        </div>
                      );
                    })}
                  </div>
                </Collapse>
                <div className="d-flex gap-2 justify-content-end p-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={consent.id}
                      id={`refuse-${consent.id}`}
                      value="0"
                      onChange={() => handleNotAcceptRadios(idx)}
                      defaultChecked={props.radioValue[consent.id] === 0}
                    />
                    <label className="form-check-label" htmlFor={`refuse-${consent.id}`}>
                      미동의
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={consent.id}
                      id={`accept-${consent.id}`}
                      value="1"
                      onChange={() => handleAcceptRadios(idx)}
                      defaultChecked={props.radioValue[consent.id] === 1}
                    />
                    <label className="form-check-label" htmlFor={`accept-${consent.id}`}>
                      동의
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleModalClose}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConsentsModal;
