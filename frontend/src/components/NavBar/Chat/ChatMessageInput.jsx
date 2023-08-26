import { useState } from 'react';
import axios from 'axios';

export default function ChatMessageInput() {
  const [chatData, setChat] = useState({
    'chat-input': 'test axios data'
  });
  const [receiver, setReceiver] = useState(294);

  const handlePostChat = async () => {
    const server_url = import.meta.env.VITE_SERVER_URL;

    const url = `${server_url}/message/api/chat/${receiver}`;
    const response = await axios.post(url, chatData);
    if (response.status === 200) {
      alert(response.data.message);
    }
  };

  return (
    <>
      <button onClick={handlePostChat}>chat</button>
    </>
  );
}
