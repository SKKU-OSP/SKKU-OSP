import { useContext, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import AuthContext from '../../../utils/auth-context';
import ProfileDropdown_Presenter from './ProfileDropdown_Presenter';

export default function ProfileDropdown_Container(props) {
  const { userName, userId } = props;
  const { username } = useContext(AuthContext);
  const [isMine, setIsMine] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const onCloseChat = () => {
    setShow(false);
  };

  const onChat = () => {
    setShow(true);
  };

  const onProfile = () => {
    navigate(`/user/${userName}`);
  };

  useEffect(() => {
    if (username == userName) setIsMine(true);
    if (username != null) setIsLogin(true);
  }, [username]);

  return (
    <ProfileDropdown_Presenter
      userName={userName}
      userId={userId}
      isMine={isMine}
      isLogin={isLogin}
      show={show}
      onChat={onChat}
      onCloseChat={onCloseChat}
      onProfile={onProfile}
    />
  );
}
