import ReactDOM from 'react-dom';
import Modal from 'react-bootstrap/Modal';
function ChatMessageModal_Presenter({ show, onCloseChatModal }) {
  const ModalContainer = () => {
    console.log('ChatMessageModal_Presenter', show, onCloseChatModal);
    return (
      <Modal show={show} onHide={onCloseChatModal}>
        <Modal.Header closeButton>
          <Modal.Title>메시지</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="spinner-border m-auto" role="status">
            <span className="visually-hidden">로딩중</span>
          </div>
        </Modal.Body>
      </Modal>
    );
  };
  const modalRoot = document.getElementById('modal-root');

  return <>{ReactDOM.createPortal(<ModalContainer />, modalRoot)}</>;
}

export default ChatMessageModal_Presenter;
