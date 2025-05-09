import { useEffect, useRef, useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';

import classes from './ChatMessageLogs.module.css';
import { getAuthConfig } from '../../../utils/auth';

const ChatMessageLogs = (props) => {
  const messageLogs = props.messageLogs;
  const [maxScroll, setMaxScroll] = useState(0);
  const [prevMaxScroll, setPrevMaxScroll] = useState(0);

  const inputRef = useRef();
  const scrollRef = useRef();
  useEffect(() => {
    // 채팅 메시지 리스트의 스크롤을 하단으로 이동
    if (props.once == 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [props.messageLogs]);

  useEffect(() => {
    scrollRef.current.scrollTop = maxScroll - prevMaxScroll;
  }, [maxScroll]);

  const handlePostChat = async () => {
    const server_url = import.meta.env.VITE_SERVER_URL;

    if (inputRef.current.value.trim() === '') {
      return;
    }
    const chatData = { 'chat-input': inputRef.current.value };
    const url = `${server_url}/message/api/chat/${props.opponentId}/`;

    const response = await axiosInstance.post(url, chatData, getAuthConfig());
    if (response.status === 200) {
      props.setLogs(response.data.data.messages);
      document.getElementById('chat-input').value = null;
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

  const onEnterKeyPostChat = (event) => {
    if (event.keyCode == 13) {
      handlePostChat();
    }
  };

  const handleScroll = () => {
    if (scrollRef.current.scrollTop === 0) {
      if (Object.keys(messageLogs).length == (props.once + 1) * 10) {
        props.setOnce(1);
        // messageLogs.reverse();
        setPrevMaxScroll(maxScroll);
        props.getAddtionalChat(props.opponentId, messageLogs['0'].send_date);
        setMaxScroll(scrollRef.current.scrollHeight - scrollRef.current.clientHeight);
      }
    }
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
              {log.board_link ? (
                <div className={ChatTextBodyClasses(log.sender.user.id)}>
                  {log.format_body[0]}
                  <a href={`/community/team/${log.board_link}`}>링크</a>

                  {log.format_body[1]}
                </div>
              ) : (
                <div className={ChatTextBodyClasses(log.sender.user.id)}>{log.body}</div>
              )}
            </div>
            <div className={classes.chatDate}>{log.format_date}</div>
          </div>
        ));
      } else {
        return <Spinner animation="border" style={{ position: 'relative', top: '40%', left: '50%' }} />;
      }
    } else {
      <div style={{ fontFamily: 'nanumfont_Regular' }}>사용자를 선택하세요.</div>;
    }
  };

  return (
    <>
      <div id="chat-view-tab" className="justify-content-between rounded-2">
        <div id="chat-view" ref={scrollRef} onScroll={handleScroll}>
          {messageLogView()}
        </div>
        <div id="chat-input-tab" className="mt-auto">
          <div id="chat-input-form">
            {props.opponentId === 0 ? (
              <input type="text" id="chat-input" name="chat-input" disabled />
            ) : (
              <input type="text" id="chat-input" name="chat-input" onKeyDown={onEnterKeyPostChat} ref={inputRef} />
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
