import { useEffect, useState } from 'react';

import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';

import ChatMessageLogs from './ChatMessageLogs';
import { getAuthConfig } from '../../../utils/auth';

const ChatUserList = (props) => {
  const [isReady, setIsReady] = useState(false);
  const [messageLogs, setMessageLogs] = useState([]);
  const [opponetId, setOpponetId] = useState(0);
  const [isSelect, setIsSelect] = useState(false);
  const [once, setOnce] = useState(0);
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const targetMember = props.targetMember;

  useEffect(() => {
    if (targetMember) handleClickItem(targetMember.user.id);
  }, [targetMember]);

  const handleClickItem = (userId) => {
    const getChatLogUrl = serverUrl + `/message/api/chat/${userId}/`;
    setIsReady(false);
    setOnce(0);
    const getChatLog = async () => {
      try {
        const response = await axiosInstance.get(getChatLogUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'fail') {
          console.log(res.status, res.errors);
        } else {
          setOpponetId(userId);
          setIsReady(true);
          setMessageLogs(res.data.messages);
          setIsSelect(true);
        }
      } catch (error) {
        console.log(error);
      }
    };
    getChatLog();
  };

  const getAdditionalChat = (userId, oldest) => {
    const getChatLogUrl = serverUrl + '/message/api/chat/' + `${userId}` + '?oldest=' + `${oldest}`;
    const getChatLog = async () => {
      try {
        const response = await axiosInstance.get(getChatLogUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'fail') {
          console.log(res.status, res.errors);
        } else {
          setMessageLogs(messageLogs.concat(res.data.messages));
        }
      } catch (error) {
        console.log(error);
      }
    };
    getChatLog();
  };

  return (
    // 왼쪽 메시지 보낼 유저 목록 출력
    <>
      <div id="oppo-list">
        <ul id="opponent-list" className="opponent-list">
          {targetMember && !props.chatRoomMembersId.includes(targetMember.user.id) && (
            <li
              id={`opo-id-${props.targetMember.user.id}`}
              className="opponent-item selected hover-opacity"
              value={props.targetMember.user.id}
            >
              <div className="d-flex">
                <div className="opponent-account me-2">
                  <img src={serverUrl + props.targetMember.photo} className="opponent-profile" />
                </div>
                <div className="my-auto">
                  <div className="opponent-name">{props.targetMember.user.username}</div>
                </div>
              </div>
            </li>
          )}
          {props.chatRoomMembers &&
            props.chatRoomMembers.map((member) => (
              <li
                key={member.account.user.id}
                id={`opo-id-${member.account.user.id}`}
                className={
                  member.account.user.id == opponetId
                    ? 'opponent-item selected hover-opacity'
                    : 'opponent-item hover-opacity'
                }
                value={`${member.account.user.id}`}
                onClick={() => {
                  handleClickItem(member.account.user.id);
                }}
              >
                <div className="d-flex">
                  <div className="opponent-account me-2">
                    <img src={`${serverUrl + member.account.photo}`} className="opponent-profile" />
                  </div>
                  <div className="my-auto">
                    <div className="opponent-name" style={{ fontFamily: 'nanumfont_Regular' }}>
                      {member.account.user.username}
                    </div>
                  </div>
                  {member.unread > 0 && <div className="ms-auto my-auto me-2 unread-count">{member.unread}</div>}
                </div>
              </li>
            ))}
        </ul>
      </div>
      <ChatMessageLogs
        messageLogs={messageLogs}
        isSelect={isSelect}
        isReady={isReady}
        opponentId={opponetId}
        once={once}
        setLogs={setMessageLogs}
        setOnce={setOnce}
        getAddtionalChat={getAdditionalChat}
      />
    </>
  );
};

export default ChatUserList;
