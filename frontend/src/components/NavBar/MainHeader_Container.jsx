import MainHeader_Presenter from './MainHeader_Presenter';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../utils/auth-context';

export default function MainHeader_Container() {
  const [isToggled, setIsToggled] = useState(false);
  const { username } = useContext(AuthContext);
  const navigate = useNavigate();

  function onClickToggle() {
    if (isToggled) {
      setIsToggled(false);
    } else {
      setIsToggled(true);
    }
  }

  const onLogin = () => {
    navigate(`/accounts/login`);
  };

  return (
    <MainHeader_Presenter
      username={username}
      isToggled={isToggled}
      onClickToggle={onClickToggle}
      onLogin={onLogin}
      location={location}
    />
  );
}
