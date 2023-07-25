import React, { useState } from 'react';
import '../User.css';
import Nav from 'react-bootstrap/Nav';
import Profile_Activity from './Profile_Activity';

function Profile_Tab() {
  const [activeTab, setActiveTab] = useState('관심분야');

  const handleTabSelect = (selectedKey) => {
    setActiveTab(selectedKey);
  };

  return (
    <>
      <div className="profile-tab">
        <Nav justify variant="underline" activeKey={activeTab} onSelect={handleTabSelect}>
          <Nav.Item>
            <Nav.Link eventKey="관심분야">관심분야</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="활동">활동</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="정보">정보</Nav.Link>
          </Nav.Item>
        </Nav>
      </div>
      <Profile_Activity Tab={activeTab} />
    </>
  );
}

export default Profile_Tab;
