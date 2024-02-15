import React, { useEffect, useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import ProfileDetail from './ProfileDetail';

function ProfileTab(props) {
  const { github_id, isEdit, open_lvl } = props;
  const [activeTab, setActiveTab] = useState('관심분야');
  const [githubId, setGithubId] = useState();
  useEffect(() => setGithubId(github_id), [github_id]);
  const handleTabSelect = (selectedKey) => {
    setActiveTab(selectedKey);
  };

  return (
    <>
      <div className="profile-tab">
        {isEdit ? (
          <Nav justify activeKey={activeTab} onSelect={handleTabSelect}>
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
        ) : (open_lvl === 2 ? (
          <Nav justify activeKey={activeTab} onSelect={handleTabSelect}>
            <Nav.Item>
              <Nav.Link eventKey="관심분야">관심분야</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="활동">활동</Nav.Link>
            </Nav.Item>
          </Nav>
        ) : (
          <Nav justify activeKey={activeTab} onSelect={handleTabSelect}>
            <Nav.Item>
              <Nav.Link eventKey="관심분야">관심분야</Nav.Link>
            </Nav.Item>
          </Nav>
        ))}
      </div>
      <ProfileDetail Tab={activeTab} githubId={githubId} isEdit={isEdit} open_lvl={open_lvl}/>
    </>
  );
}

export default ProfileTab;
