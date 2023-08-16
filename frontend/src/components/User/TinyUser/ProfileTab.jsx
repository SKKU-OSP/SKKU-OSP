import React, { useEffect, useState } from 'react';
import '../User.css';
import Nav from 'react-bootstrap/Nav';
import ProfileActivity from './ProfileActivity';

function ProfileTab(props) {
  const [activeTab, setActiveTab] = useState('관심분야');
  const [githubId, setGithubId] = useState();
  const github_id = props.githubId;
  useEffect(() => setGithubId(github_id), [github_id]);
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
      <ProfileActivity Tab={activeTab} githubId={githubId} />
    </>
  );
}

export default ProfileTab;
