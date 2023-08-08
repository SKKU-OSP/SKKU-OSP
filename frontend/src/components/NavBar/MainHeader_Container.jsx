import MainHeader_Presenter from './MainHeader_Presenter';
import { useState, useContext } from 'react';
import AuthContext from '../../utils/auth-context';

export default function MainHeader_Container(props) {
  const [isToggled, setIsToggled] = useState(false);

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

  return <MainHeader_Presenter username={username} isToggled={isToggled} onClickToggle={onClickToggle} />;
}
