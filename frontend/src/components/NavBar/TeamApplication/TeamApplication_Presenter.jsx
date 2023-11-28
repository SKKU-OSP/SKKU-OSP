import TeamApplication from './TeamApplication';
import { useState } from 'react';
import { MdOutlineAssignmentInd } from 'react-icons/md';

export default function TeamApplication_Presenter({ newAlert, iconSize, showTeamApp, setShowTeamApp }) {
  const handleClose = () => {
    setShowTeamApp(false);
  };
  const handleShow = () => {
    setShowTeamApp(true);
  };
  return (
    <>
      <MdOutlineAssignmentInd size={iconSize} color="white" onClick={handleShow} className="nav-bar-icons" />
      <TeamApplication handleClose={handleClose} show={showTeamApp} />
      {newAlert && (
        <span className="badge-new badge-new-alert-application">
          <span className="visually-hidden">New Application</span>
        </span>
      )}
    </>
  );
}
