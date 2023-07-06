import ChatMessage_Container from './ChatMessage_Container';
import Notification_Container from './Notification_Container';
import TeamApplication_Container from './TeamApplication_Container';

function IconList_Presenter() {
  return (
    <>
      <TeamApplication_Container />
      <ChatMessage_Container />
      <Notification_Container />
    </>
  );
}

export default IconList_Presenter;
