import Dropdown from 'react-bootstrap/Dropdown';
import React from 'react';
import '../../MainHeader.css';

export default function Profile_Presenter(props) {
  const { iconSize, photo } = props;

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
        <Dropdown.Item href="#">내 프로필</Dropdown.Item>
        <Dropdown.Item href="#">내가 작성한 글</Dropdown.Item>
        <Dropdown.Item href="#">내가 작성한 댓글</Dropdown.Item>
        <Dropdown.Item href="#">내가 스크랩한 글</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
