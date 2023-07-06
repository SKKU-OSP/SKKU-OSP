import { MdOutlineEmail } from 'react-icons/md';
import ChatMessageModal_Container from './ChatMessageModal_Container';

export default function ChatMessage_Presenter({ newAlert, show, onOpenChatModal, onCloseChatModal }) {
  return (
    <>
      {newAlert && (
        <span
          id="new-app"
          className="badge-new"
          data-new-send="{{ notifications.has_new_app_result }}"
          data-new-recv="{{ notifications.has_new_app }}"
        >
          <span className="visually-hidden">New Application</span>
        </span>
      )}

      <button onClick={onOpenChatModal}>
        <MdOutlineEmail />
      </button>
      <ChatMessageModal_Container show={show} onCloseChatModal={onCloseChatModal} />
    </>
  );
}
