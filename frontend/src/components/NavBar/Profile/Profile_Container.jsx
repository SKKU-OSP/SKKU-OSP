import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Profile_Presenter from './Profile_Presenter';
import AuthContext from '../../../utils/auth-context';
import { tokenRemover } from '../../../utils/auth';

const domain_url = import.meta.env.VITE_SERVER_URL;
const logout_url = `${domain_url}/accounts/logout/`;

export default function Profile_Container({ iconSize }) {
  const { username, photo } = useContext(AuthContext);
  const navigate = useNavigate();

  const { unsetUser } = useContext(AuthContext);

  const sendLogoutRequest = async () => {
    try {
      const response = await axios.get(logout_url);
      const res = response.data;
      console.log(res);
      unsetUser();
      tokenRemover();
      localStorage.removeItem('username');
      navigate('/accounts/login');
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <Profile_Presenter
      username={username}
      iconSize={iconSize}
      photo={domain_url + photo}
      sendLogoutRequest={sendLogoutRequest}
    />
  );
}
