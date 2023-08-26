import { useEffect, useState } from 'react';
import ChatMessageModal_Presenter from './ChatMessageModal_Presenter';

import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';

export default function ChatMessageModal_Container({ show, onCloseChatModal }) {
  const [loading, setLoading] = useState(true);
  const [chatRoomMembers, setChatRoomMembers] = useState([]);
  const [targetMember, setTargetMember] = useState(null);
  useEffect(() => {
    const fetchChatRoom = async () => {
      try {
        console.log('fetchChatRoom');
        const server_url = import.meta.env.VITE_SERVER_URL;
        const url = `${server_url}/message/api/room/list/47`;
        const response = await axios.get(url, getAuthConfig());
        if (response.data.status === 'success') {
          console.log(response.data.data.chat_accounts);

          setChatRoomMembers(response.data.data.chat_accounts);
          setTargetMember(response.data.data.target_account);
          setLoading(false);
        }
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    fetchChatRoom();
  }, []);

  return (
    <ChatMessageModal_Presenter
      show={show}
      onCloseChatModal={onCloseChatModal}
      loading={loading}
      chatRoomMembers={chatRoomMembers}
      targetMember={targetMember}
    />
  );
}
