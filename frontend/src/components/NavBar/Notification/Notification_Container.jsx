import Notification_Presenter from './Notification_Presenter';

export default function Notification_Container({ iconSize, showNoti, setShowNoti, setShowTeamApp }) {
  return (
    <Notification_Presenter
      iconSize={iconSize}
      showNoti={showNoti}
      setShowNoti={setShowNoti}
      setShowTeamApp={setShowTeamApp}
    />
  );
}
