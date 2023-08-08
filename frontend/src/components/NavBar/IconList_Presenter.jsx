import ChatMessage_Container from './Chat/ChatMessage_Container';
import Notification_Container from './Notification/Notification_Container';
import TeamApplication_Container from './TeamApplication/TeamApplication_Container';
import Profile_Container from './Profile/Profile_Container';

function IconList_Presenter(props) {
  const { iconSize, username } = props;
  
  return (
    <div className="nav-bar-icon-list">
      <TeamApplication_Container iconSize={iconSize} />
      <ChatMessage_Container iconSize={iconSize} />
      <Notification_Container iconSize={iconSize} />
      {username && <Profile_Container iconSize={iconSize} />}
    </div>
  );
}

export default IconList_Presenter;
