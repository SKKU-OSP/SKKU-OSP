import Dropdown from 'react-bootstrap/Dropdown';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../MainHeader.css';

export default function Profile_Presenter(props) {
  const { username, iconSize, photo, sendLogoutRequest } = props;

  const navigate = useNavigate();

  const handleOpenNewTab = (url) => {
    window.open(url, '_blank', 'noopener, noreferrer');
  };
  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <img
      className="header-profile-img"
      src={photo}
      width={iconSize}
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    />
  ));

  return (
    <Dropdown className="on-mobile">
      <Dropdown.Toggle as={CustomToggle} id="dropdown-basic"></Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item href={`/user/${username}`}>내 프로필</Dropdown.Item>
        <Dropdown.Item href={`https://equinox-rule-857.notion.site/SOSD-User-Manual-4283b4cc583e47298a42470a11be1c42`}>
          사용자 가이드
        </Dropdown.Item>
        <Dropdown.Item onClick={sendLogoutRequest}>로그아웃</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
