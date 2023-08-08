import { useEffect, useState } from 'react';
import '../../User.css';
import { BsXLg } from 'react-icons/bs';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

function InterestModal(props) {
  const interest = props.interest;
  const myInterest = props.myInterest;
  const interestShow = props.interestShow;
  const OnHandleInterestClose = props.OnHandleInterestClose;
  const OnHandleInterestSaveClose = props.OnHandleInterestSaveClose;
  const [selectedInterest, setSelectedInterest] = useState();
  const [modalInterest, setModalInterest] = useState(myInterest);
  const OnHandleInterestSelect = (selectedInterest) => setSelectedInterest(selectedInterest);
  const OnHandleModalInterest = () => setModalInterest([...modalInterest, selectedInterest]);
  const OnHandleRemoveInterest = (removeLabel) => {
    setModalInterest(modalInterest.filter((interest) => interest.label !== removeLabel));
  };
  useEffect(() => {
    setModalInterest(myInterest);
  }, [interestShow]);

  return (
    <Modal size="lg" show={interestShow} onHide={OnHandleInterestClose}>
      <Modal.Header closeButton>
        <Modal.Title>관심분야 설정</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column modal-interest">
          <div className="d-flex flex-row modal-interest-input">
            <Select
              className="modal-interest-select"
              size="lg"
              name="interest"
              onChange={OnHandleInterestSelect}
              options={interest.filter((item) => !modalInterest.some((mi) => item.value === mi.value))}
            />
            <button className="btn" onClick={OnHandleModalInterest}>
              <span className="btn-text">+</span>
            </button>
          </div>
          <div className="d-flex flex-row modal-interest-result">
            {modalInterest.map((interest) => (
              <div className="d-flex flex-row align-items-center modal-input" key={`modal-interest-${interest.value}`}>
                <span className="input-text">{interest.label}</span>
                <BsXLg size={14} onClick={() => OnHandleRemoveInterest(interest.label)} style={{ cursor: 'pointer' }} />
              </div>
            ))}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-dark" onClick={() => OnHandleInterestSaveClose(modalInterest)}>
          저장
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default InterestModal;
