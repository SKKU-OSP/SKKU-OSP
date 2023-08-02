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
  const OnHandleInterestSaveClose = props.OnHandleInterestSaveClose;
  const [selectedInterest, setSelectedInterest] = useState(myInterest);
  const [modalInterest, setModalInterest] = useState(myInterest);
  const OnHandleInterestSelect = (selectedInterest) => setSelectedInterest(selectedInterest);
  const OnHandleModalInterest = () => setModalInterest(selectedInterest);
  const OnHandleInterestClose = () => (
    setSelectedInterest(myInterest), setModalInterest(myInterest), props.OnHandleInterestClose()
  );
  const OnHandleRemoveInterest = (removeLabel) => {
    setModalInterest((prevInterest) => prevInterest.filter((interest) => interest.label !== removeLabel));
  };
  useEffect(() => {
    setSelectedInterest(modalInterest);
  }, [modalInterest]);

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
              isMulti={true}
              name="interest"
              value={selectedInterest}
              onChange={OnHandleInterestSelect}
              options={interest}
            />
            <button className="btn" onClick={OnHandleModalInterest}>
              <span className="btn-text">+</span>
            </button>
          </div>
          <div className="d-flex flex-row modal-interest-result">
            {modalInterest.map((interest) => (
              <div className="d-flex flex-row align-items-center modal-input">
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
