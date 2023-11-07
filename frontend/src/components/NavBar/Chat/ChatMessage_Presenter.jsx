import { MdOutlineEmail } from 'react-icons/md';

import ChatMessageModal_Container from './ChatMessageModal_Container';

import '../IconList/IconList.css';
import '../../Community/Article/base.css';

export default function ChatMessage_Presenter({ newMessage, show, onOpenChatModal, onCloseChatModal, iconSize }) {
  return (
    <>
      {newMessage && (
        <span className="badge-new">
          <span className="visually-hidden">New Application</span>
        </span>
      )}

      <MdOutlineEmail size={iconSize} onClick={onOpenChatModal} className="nav-bar-icons" />
      <ChatMessageModal_Container show={show} onCloseChatModal={onCloseChatModal} targetId={0} />
    </>
  );
}
