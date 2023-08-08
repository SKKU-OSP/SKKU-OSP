import { useContext } from 'react';
import IconList_Presenter from './IconList_Presenter';
import AuthContext from '../../utils/auth-context';

function IconList_Container() {
  const { username } = useContext(AuthContext);
  const iconSize = '24';

  return <IconList_Presenter username={username} iconSize={iconSize} />;
}

export default IconList_Container;
