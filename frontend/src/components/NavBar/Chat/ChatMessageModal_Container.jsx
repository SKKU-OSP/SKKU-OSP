import ChatMessageModal_Presenter from './ChatMessageModal_Presenter';

export default function ChatMessageModal_Container({ show, onCloseChatModal }) {
  return <ChatMessageModal_Presenter show={show} onCloseChatModal={onCloseChatModal} />;
}
