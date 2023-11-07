import { useEffect, useState } from 'react';

import axios from 'axios';

import { getAuthConfig } from '../../../utils/auth';
import ChatMessage_Presenter from './ChatMessage_Presenter';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function ChatMessage_Container({ iconSize }) {
  const [newMessage, setNewMessage] = useState(false);
  const [show, setShow] = useState(false);

  const handleClose = () => {
    setShow(false);
  };

  const handleShow = () => {
    setShow(true);
  };

  const checkNewMessage = async () => {
    try {
      const url = server_url + '/message/api/chat/new/';
      const response = await axios.get(url, getAuthConfig());
      const res = response.data;
      if (res.data.show_new_message) {
        setNewMessage(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // axios 요청으로 새로운 채팅 메시지 여부 확인
    checkNewMessage();
  }, []);

  return (
    <ChatMessage_Presenter
      onOpenChatModal={handleShow}
      onCloseChatModal={handleClose}
      show={show}
      newMessage={newMessage}
      iconSize={iconSize}
    />
  );
}
