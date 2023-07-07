import ReactDOM from 'react-dom';
import Modal from 'react-bootstrap/Modal';
function ChatMessageModal_Presenter({ show, onCloseChatModal, loading, chatRoomMembers, targetMember }) {
  const RoomMemberListContainer = () => {
    return (
      <div id="oppo-list">
        <ul id="opponent-list" className="opponent-list">
          {chatRoomMembers.map((member) => (
            <li
              key={member.account.user.id}
              id={`opo-id-${member.account.user.id}`}
              className="opponent-item hover-opacity"
              value={`${member.account.user.id}`}
            >
              <div className="d-flex">
                <div className="opponent-account me-2">
                  <img src={`${member.account.photo}`} className="opponent-profile" />
                </div>
                <div className="my-auto">
                  <div className="opponent-name">{member.account.user.username}</div>
                </div>
              </div>
            </li>
          ))}

          {targetMember && (
            <li
              id={`opo-id-${targetMember.user.id}`}
              className="opponent-item hover-opacity"
              value={targetMember.user.id}
            >
              <div className="d-flex">
                <div className="opponent-account me-2">
                  <img src={targetMember.photo} className="opponent-profile" />
                </div>
                <div className="my-auto">
                  <div className="opponent-name">{targetMember.user.username}</div>
                </div>
              </div>
            </li>
          )}
        </ul>
      </div>
    );
  };
  const ModalContainer = () => {
    return (
      <Modal show={show} onHide={onCloseChatModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>메시지</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading && (
            <div className="spinner-border m-auto" role="status">
              <span className="visually-hidden">로딩중</span>
            </div>
          )}
          {!loading && chatRoomMembers.length !== 0 && <RoomMemberListContainer />}
        </Modal.Body>
      </Modal>
    );
  };
  const modalRoot = document.getElementById('modal-root');

  return <>{ReactDOM.createPortal(<ModalContainer />, modalRoot)}</>;
}

export default ChatMessageModal_Presenter;
