import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SideBar_Presenter from './SideBar_Presenter';
import AuthContext from '../../../utils/auth-context';

const domain_url = import.meta.env.VITE_SERVER_URL;
const logout_url = `${domain_url}/accounts/logout/`;

export default function SideBar_Container() {
  const { name, username, githubUsername } = useContext(AuthContext);
  const navigate = useNavigate();

  const { unsetUser } = useContext(AuthContext);
  const [error, setError] = useState(false);

  const sendLogoutRequest = async () => {
    try {
      const response = await axios.get(logout_url);
      const res = response.data;

      localStorage.setItem('access_token', null);
      localStorage.setItem('refresh_token', null);

      unsetUser();
      navigate('/accounts/login');
    } catch (error) {
      console.log('error', error);
      setError(error.message);
    }
  };

  const onMyProfile = () => {
    navigate(`/user/${username}`);
  };

  const onMyGithub = () => {
    window.open(`https://www.github.com/${githubUsername}`);
  };

  const onLogin = () => {
    navigate(`/accounts/login`);
  };

  useEffect(() => {});

  return (
    <SideBar_Presenter
      name={name}
      username={username}
      githubUsername={githubUsername}
      onMyProfile={onMyProfile}
      onMyGithub={onMyGithub}
      onLogin={onLogin}
      sendLogoutRequest={sendLogoutRequest}
    />
  );
}
