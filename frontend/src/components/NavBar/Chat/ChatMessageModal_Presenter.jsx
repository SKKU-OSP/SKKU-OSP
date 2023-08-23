import ReactDOM, { render } from 'react-dom';
import Modal from 'react-bootstrap/Modal';
import SendIcon from '@mui/icons-material/Send';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';
import ChatMessageLogs from './ChatMessageLogs';
import ChatUserList from './ChatUserList';

function ChatMessageModal_Presenter({ show, onCloseChatModal, loading, chatRoomMembers, targetMember }) {
  //   const messageContentUrl = serverUrl + '/message/api/chat/294';
  //   useEffect(() => {
  //     try{
  //         const getData = async () =>{
  //             const response = await axios.get(messageContentUrl,getAuthConfig());
  //             const res = response.data;
  //             if(res.status == 'success') {
  //                 setMessageContent(res.data.messages.body);
  //                 console.log(messageContent)
  //             }
  //         }
  //         getData();
  //     }catch(error){
  //         console.log('error',error);
  //     }
  // })

  const ModalContainer = () => {
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
              <ChatUserList chatRoomMembers={chatRoomMembers} targetMember={targetMember} />
            )}
          </div>
        </Modal.Body>
      </Modal>
    );
  };
  const modalRoot = document.getElementById('modal-root');

  return <>{ReactDOM.createPortal(<ModalContainer />, modalRoot)}</>;
}

export default ChatMessageModal_Presenter;
