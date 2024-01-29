import TeamApplication from './TeamApplication';
import { useState } from 'react';
import { MdOutlineAssignmentInd } from 'react-icons/md';
import Tooltip from '../ToolTip/ToolTip';

export default function TeamApplication_Presenter({ newAlert, iconSize, showTeamApp, setShowTeamApp }) {
  const handleClose = () => {
    setShowTeamApp(false);
  };
  const handleShow = () => {
    setShowTeamApp(true);
  };
  return (
    <>
      <Tooltip text="팀 지원서 목록">
        <MdOutlineAssignmentInd size={iconSize} color="white" onClick={handleShow} className="nav-bar-icons" />
        <TeamApplication handleClose={handleClose} show={showTeamApp} />
      </Tooltip>
      {newAlert && (
        <span className="badge-new badge-new-alert-application">
          <span className="visually-hidden">New Application</span>
        </span>
      )}
    </>
  );
}
