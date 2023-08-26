import { useEffect, useRef } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';

import classes from './ChatMessageLogs.module.css';
import { getAuthConfig } from '../../../utils/auth';

const ChatMessageLogs = (props) => {
  const messageLogs = props.messageLogs;

  const inputRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {
    // 채팅 메시지 리스트의 스크롤을 하단으로 이동
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [props.messageLogs]);

  const handlePostChat = async () => {
    const server_url = import.meta.env.VITE_SERVER_URL;

    if (inputRef.current.value.trim() === '') {
      return;
    }
    const chatData = { 'chat-input': inputRef.current.value };
    const url = `${server_url}/message/api/chat/${props.opponentId}`;

    const response = await axios.post(url, chatData, getAuthConfig());
    if (response.status === 200) {
      console.log(response);
      alert(response.data.message);
      props.setLogs(response.data.data.messages);
    }
  };

  const chatBoxClasses = (senderId) => {
    return props.opponentId === senderId ? classes.ChatBoxRecieve : classes.ChatBoxSend;
  };

  const chatTextClasses = (senderId) => {
    return props.opponentId === senderId ? classes.chatTextRecieve : classes.chatTextSend;
  };

  const ChatTextBodyClasses = (senderId) => {
    return props.opponentId === senderId ? classes.chatTextBodyRecieve : classes.chatTextBodySend;
  };

  const messageLogView = () => {
    if (props.isSelect) {
      if (props.isReady) {
        return messageLogs.reverse().map((log) => (
          <div className={chatBoxClasses(log.sender.user.id)} key={log.id}>
            <div className={chatTextClasses(log.sender.user.id)}>
              {log.receiver_read == false && props.opponentId !== log.sender.user.id && (
                <div className={classes.chatUnread}></div>
              )}
              <div className={ChatTextBodyClasses(log.sender.user.id)}>{log.body}</div>
            </div>
            <div className={classes.chatDate}>{log.format_date}</div>
          </div>
        ));
      } else {
        return <Spinner animation="border" style={{ position: 'relative', top: '40%', left: '50%' }} />;
      }
    } else {
      <div>사용자를 선택하세요.</div>;
    }
  };
  return (
    <>
      <div id="chat-view-tab" className="justify-content-between rounded-2">
        <div id="chat-view" ref={scrollRef}>
          {messageLogView()}
        </div>
        <div id="chat-input-tab" className="mt-auto">
          <div id="chat-input-form">
            {props.opponentId === 0 ? (
              <input type="text" id="chat-input" name="chat-input" disabled />
            ) : (
              <input type="text" id="chat-input" name="chat-input" ref={inputRef} />
            )}

            <button id="chat-submit" type="button" onClick={handlePostChat}>
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatMessageLogs;
