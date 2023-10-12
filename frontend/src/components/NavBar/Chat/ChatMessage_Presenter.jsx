import { MdOutlineEmail } from 'react-icons/md';
import ChatMessageModal_Container from './ChatMessageModal_Container';
import '../IconList/IconList.css';
import '../../Community/Article/base.css';

export default function ChatMessage_Presenter({ newAlert, show, onOpenChatModal, onCloseChatModal, iconSize }) {
  return (
    <>
      {newAlert && (
        <span
          className="badge-new"
          data-new-send="{{ notifications.has_new_app_result }}"
          data-new-recv="{{ notifications.has_new_app }}"
        >
          <span className="visually-hidden">New Application</span>
        </span>
      )}

      <MdOutlineEmail size={iconSize} onClick={onOpenChatModal} className="nav-bar-icons" />
      <ChatMessageModal_Container show={show} onCloseChatModal={onCloseChatModal} targetId={0} />
    </>
  );
}
