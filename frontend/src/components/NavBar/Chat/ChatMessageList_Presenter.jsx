import { useState, useEffect } from 'react';
import axios from 'axios';

function ChatMessageList_Presenter() {
  const [chatData, setChat] = useState({
    'chat-input': 'test axios data'
  });
  const [receiver, setReceiver] = useState(294);

  useEffect(() => {
    console.log('use Effect');
  }, []);

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

export default ChatMessageList_Presenter;
