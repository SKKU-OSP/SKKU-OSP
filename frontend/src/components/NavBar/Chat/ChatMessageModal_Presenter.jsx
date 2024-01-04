import Modal from 'react-bootstrap/Modal';
import ChatUserList from './ChatUserList';

function ChatMessageModal_Presenter({
  show,
  onCloseChatModal,
  loading,
  chatRoomMembers,
  chatRoomMembersId,
  targetMember
}) {
  return (
    <Modal show={show} onHide={onCloseChatModal} size="lg" scrollable={true}>
      <Modal.Header closeButton>
        <Modal.Title>메시지</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row" style={{ maxHeight: '480px', minHeight: '320px' }}>
          {loading && (
            <div className="spinner-border m-auto" role="status">
              <span className="visually-hidden">로딩중</span>
            </div>
          )}
          {!loading && chatRoomMembers.length !== 0 && (
            <ChatUserList
              chatRoomMembers={chatRoomMembers}
              chatRoomMembersId={chatRoomMembersId}
              targetMember={targetMember}
            />
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default ChatMessageModal_Presenter;
