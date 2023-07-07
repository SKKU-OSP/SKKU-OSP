import { useState, useEffect } from 'react';
import ChatMessage_Presenter from './ChatMessage_Presenter';

export default function ChatMessage_Container() {
  const [newAlert, setNewAlert] = useState(false);
  const [show, setShow] = useState(false);

  const handleClose = () => {
    console.log('handleClose');
    setShow(false);
  };
  const handleShow = () => {
    console.log('handleShow');
    setShow(true);
  };

  useEffect(() => {
    // axios 요청으로 새로운 채팅 메시지 여부 확인
    setNewAlert(true);
  }, []);

  return (
    <ChatMessage_Presenter
      onOpenChatModal={handleShow}
      onCloseChatModal={handleClose}
      show={show}
      newAlert={newAlert}
    />
  );
}
