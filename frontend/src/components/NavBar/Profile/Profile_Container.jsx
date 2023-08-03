import { useContext } from 'react';
import Profile_Presenter from './Profile_Presenter';
import AuthContext from '../../../utils/auth-context';

const domain_url = import.meta.env.VITE_SERVER_URL;

export default function Profile_Container({ iconSize }) {
  const { photo } = useContext(AuthContext);

  return <Profile_Presenter iconSize={iconSize} photo={domain_url + photo} />;
}
