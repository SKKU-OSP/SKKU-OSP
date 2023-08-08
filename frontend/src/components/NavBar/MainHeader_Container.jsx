import MainHeader_Presenter from './MainHeader_Presenter';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../utils/auth-context';

export default function MainHeader_Container(props) {
  const [isToggled, setIsToggled] = useState(false);
  const navigate = useNavigate();

  function onClickToggle() {
    if (isToggled) {
      setIsToggled(false);
    } else {
      setIsToggled(true);
    }
  }

  // TODO 유저 인증시 변경되는 설정 적용
  const [isAuth] = useState(true);
  const { username } = useContext(AuthContext);

  const onLogin = () => {
    navigate(`/accounts/login`);
  };

  return <MainHeader_Presenter username={username} isToggled={isToggled} onClickToggle={onClickToggle} onLogin={onLogin} />;
}
