import Modal from 'react-bootstrap/Modal';
import ChatUserList from './ChatUserList';

function ChatMessageModal_Presenter({
  show,
  onCloseChatModal,
  loading,
  chatRoomMembers,
  chatRoomMembersId,
  targetMember,
  targetId
}) {
  return (
    <Modal show={show} onHide={onCloseChatModal} size="lg" scrollable={true}>
      <Modal.Header closeButton>
        <Modal.Title style={{fontFamily: "nanumfont_ExtraBold"}}>메시지</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row" style={{ maxHeight: '480px', minHeight: '320px' }}>
          {loading && (
            <div className="spinner-border m-auto" role="status">
              <span className="visually-hidden">로딩중</span>
            </div>
          )}
          {!loading && (chatRoomMembers.length !== 0 || targetId != 0) && (
            <ChatUserList
              chatRoomMembers={chatRoomMembers}
              chatRoomMembersId={chatRoomMembersId}
              targetMember={targetMember}
            />
          )}
          {!loading && chatRoomMembers == 0 && targetId == 0 && (
            <div style={{textAlign: "center", fontSize:"35px", fontFamily:"nanumfont_Bold", width: "100%"}}>메시지함이 비어있습니다.</div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default ChatMessageModal_Presenter;
