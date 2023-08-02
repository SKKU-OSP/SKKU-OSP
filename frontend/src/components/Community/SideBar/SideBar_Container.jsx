import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar_Presenter from './SideBar_Presenter';
import AuthContext from '../../../utils/auth-context';

export default function SideBar_Container() {
  const { username, githubUsername } = useContext(AuthContext);
  const navigate = useNavigate();

  const onMyProfile = () => {
    navigate(`/user/${username}`);
  };

  const onMyGithub = () => {
    window.open(`https://www.github.com/${githubUsername}`);
  };

  const onLogin = () => {
    navigate(`/accounts/login`);
  };

  useEffect(() => {
    console.log('username:', username);
  });

  return (
    <SideBar_Presenter
      username={username}
      githubUsername={githubUsername}
      onMyProfile={onMyProfile}
      onMyGithub={onMyGithub}
      onLogin={onLogin}
    />
  );
}
