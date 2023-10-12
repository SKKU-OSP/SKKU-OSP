import { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import SideBar_Presenter from './SideBar_Presenter';
import AuthContext from '../../../utils/auth-context';
import { tokenRemover } from '../../../utils/auth';

const domain_url = import.meta.env.VITE_SERVER_URL;
const logout_url = `${domain_url}/accounts/logout/`;

export default function SideBar_Container() {
  const { name, username, githubUsername, photo } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation().pathname;

  const { unsetUser } = useContext(AuthContext);
  const [error, setError] = useState(false);

  const sendLogoutRequest = async () => {
    try {
      const response = await axios.get(logout_url);
      const res = response.data;
      tokenRemover();
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
      photo={domain_url + photo}
      onMyProfile={onMyProfile}
      onMyGithub={onMyGithub}
      onLogin={onLogin}
      sendLogoutRequest={sendLogoutRequest}
      location={location}
    />
  );
}
