import { MdOutlineEmail } from 'react-icons/md';
import Tooltip from '../ToolTip/ToolTip';

import ChatMessageModal_Container from './ChatMessageModal_Container';

import '../IconList/IconList.css';
import '../../Community/Article/base.css';

export default function ChatMessage_Presenter({ newMessage, show, onOpenChatModal, onCloseChatModal, iconSize }) {
  return (
    <>
      <Tooltip text="메시지">
        <MdOutlineEmail size={iconSize} color="white" onClick={onOpenChatModal} className="nav-bar-icons" />
        <ChatMessageModal_Container show={show} onCloseChatModal={onCloseChatModal} targetId={0} />
      </Tooltip>
      {newMessage && (
        <span className="badge-new badge-new-message">
          <span className="visually-hidden">New Application</span>
        </span>
      )}
    </>
  );
}
