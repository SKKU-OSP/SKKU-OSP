import React from 'react';

import { MdOutlineStarOutline } from 'react-icons/md';
import Dropdown from 'react-bootstrap/Dropdown';
import { useNavigate } from 'react-router-dom';

import '../IconList/IconList.css';
import classes from './AdminDropDown.module.css';

const AdminDropDown = ({ iconSize }) => {
  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <a
      href=""
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      style={{ verticalAlign: 'text-bottom' }}
    >
      {children}
    </a>
  ));
  const handleOpenNewTab = (url) => {
    window.open(url, '_blank', 'noopener, noreferrer');
  };

  const navigate = useNavigate();
  return (
    <Dropdown>
      <Dropdown.Toggle as={CustomToggle}>
        <MdOutlineStarOutline size={iconSize} className="text-dark" />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => navigate('/statistics')}>GitHub 통계</Dropdown.Item>
        <Dropdown.Item onClick={() => navigate('/rank/user')}>유저 랭킹</Dropdown.Item>
        <Dropdown.Item onClick={() => navigate('/rank/repo')}>리포지토리 랭킹</Dropdown.Item>
        <Dropdown.Item
          onClick={() =>
            handleOpenNewTab(
              'https://analytics.google.com/analytics/web/#/p375838293/reports/intelligenthome?params=_u..nav%3Dmaui&collectionId=use'
            )
          }
        >
          Google Analytics
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default AdminDropDown;
