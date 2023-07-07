import { MdOutlineEmail } from 'react-icons/md';
import ChatMessageModal_Container from './ChatMessageModal_Container';

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

      <button onClick={onOpenChatModal}>
        <MdOutlineEmail size={iconSize} />
      </button>
      <ChatMessageModal_Container show={show} onCloseChatModal={onCloseChatModal} />
    </>
  );
}
