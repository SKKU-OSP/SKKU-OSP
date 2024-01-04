import { useState } from 'react';
import ChatMessage_Container from '../Chat/ChatMessage_Container';
import Notification_Container from '../Notification/Notification_Container';
import TeamApplication_Container from '../TeamApplication/TeamApplication_Container';
import Profile_Container from '../Profile/Profile_Container';
import AdminDropDown from '../adminNav/AdminDropDown';

function IconList_Presenter({ iconSize, username }) {
  const [showTeamApp, setShowTeamApp] = useState(false);
  const [showNoti, setShowNoti] = useState(false);

  return (
    <div className="nav-bar-icon-list">
      {username === 'admin' ? <AdminDropDown iconSize={iconSize} /> : <></>}
      <TeamApplication_Container iconSize={iconSize} showTeamApp={showTeamApp} setShowTeamApp={setShowTeamApp} />
      <ChatMessage_Container iconSize={iconSize} />
      <Notification_Container
        iconSize={iconSize}
        showNoti={showNoti}
        setShowNoti={setShowNoti}
        setShowTeamApp={setShowTeamApp}
      />
      <Profile_Container iconSize={iconSize} />
    </div>
  );
}

export default IconList_Presenter;
