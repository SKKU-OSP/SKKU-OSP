import TeamApplication from './TeamApplication';
import { useState } from 'react';
import { MdOutlineAssignmentInd } from 'react-icons/md';

export default function TeamApplication_Presenter({ iconSize }) {
  const [show, setShow] = useState(false);

  const handleClose = () => {
    setShow(false);
  };
  const handleShow = () => {
    setShow(true);
  };

  return (
    <>
      <MdOutlineAssignmentInd size={iconSize} onClick={handleShow} className="nav-bar-icons" />
      <TeamApplication handleClose={handleClose} show={show} />
    </>
  );
}
