import { MdOutlineNotificationsNone } from 'react-icons/md';
import Tooltip from '../ToolTip/ToolTip';

import NotificationModal from './NotificationModal';

export default function Notification_Presenter({
  newAlert,
  iconSize,
  showNoti,
  setShowTeamApp,
  handleClose,
  handleShow,
  notiList,
  setNotiList
}) {
  return (
    <>
      <Tooltip text="알림내역">
        <MdOutlineNotificationsNone size={iconSize} color="white" onClick={handleShow} className="nav-bar-icons" />
        <NotificationModal
          iconSize={iconSize}
          show={showNoti}
          handleClose={handleClose}
          setShowTeamApp={setShowTeamApp}
          notiList={notiList}
          setNotiList={setNotiList}
        />
      </Tooltip>
      {newAlert && (
        <span className="badge-new badge-new-alert-noti">
          <span className="visually-hidden">New Application</span>
        </span>
      )}
    </>
  );
}
