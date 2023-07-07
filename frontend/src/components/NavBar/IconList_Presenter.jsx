import ChatMessage_Container from './Chat/ChatMessage_Container';
import Notification_Container from './Notification/Notification_Container';
import TeamApplication_Container from './TeamApplication/TeamApplication_Container';

function IconList_Presenter({ iconSize }) {
  return (
    <>
      <TeamApplication_Container iconSize={iconSize} />
      <ChatMessage_Container iconSize={iconSize} />
      <Notification_Container iconSize={iconSize} />
    </>
  );
}

export default IconList_Presenter;
