import TeamApplication from './TeamApplication';
import { useState } from 'react';
import { MdOutlineAssignmentInd } from 'react-icons/md';

export default function TeamApplication_Presenter({ iconSize, showTeamApp, setShowTeamApp }) {
  const handleClose = () => {
    setShowTeamApp(false);
  };
  const handleShow = () => {
    setShowTeamApp(true);
  };

  return (
    <>
      <MdOutlineAssignmentInd size={iconSize} onClick={handleShow} className="nav-bar-icons" />
      <TeamApplication handleClose={handleClose} show={showTeamApp} />
    </>
  );
}
