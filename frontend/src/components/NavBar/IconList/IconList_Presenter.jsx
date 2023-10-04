import ChatMessage_Container from '../Chat/ChatMessage_Container';
import Notification_Container from '../Notification/Notification_Container';
import TeamApplication_Container from '../TeamApplication/TeamApplication_Container';
import Profile_Container from '../Profile/Profile_Container';
import AdminDropDown from '../adminNav/adminDropDown';
import { useScrollTrigger } from '@mui/material';
import { useState } from 'react';

function IconList_Presenter({ iconSize, username }) {
  const [showTeamApp, setShowTeamApp] = useState(false);
  const [showNoti, setShowNoti] = useState(false);
  console.log(typeof username);
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
