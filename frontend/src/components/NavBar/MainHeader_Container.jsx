import MainHeader_Presenter from './MainHeader_Presenter';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../utils/auth-context';

export default function MainHeader_Container(props) {
  const [isToggled, setIsToggled] = useState(false);
  const { username } = useContext(AuthContext);
  const navigate = useNavigate();

  function onClickToggle() {
    if (isToggled) {
      setIsToggled(false);
      document.getElementsByTagName('header')[0].style.height = '85px';
      document.getElementsByClassName('community-nav')[0].style.top = '85px';
    } else {
      setIsToggled(true);
      document.getElementsByTagName('header')[0].style.height = '180px';
      document.getElementsByClassName('community-nav')[0].style.top = '180px';
    }
  }

  const onLogin = () => {
    navigate(`/accounts/login`);
  };

  return (
    <MainHeader_Presenter username={username} isToggled={isToggled} onClickToggle={onClickToggle} onLogin={onLogin} />
  );
}
