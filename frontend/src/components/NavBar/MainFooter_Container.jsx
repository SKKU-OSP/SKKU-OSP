import MainFooter_Presenter from './MainFooter_Presenter';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../utils/auth-context';

export default function MainFooter_Container() {
  const [isToggled, setIsToggled] = useState(false);

  function onClickToggle() {
    if (isToggled) {
      setIsToggled(false);
    } else {
      setIsToggled(true);
    }
  }

  return <MainFooter_Presenter isToggled={isToggled} onClickToggle={onClickToggle} />;
}
