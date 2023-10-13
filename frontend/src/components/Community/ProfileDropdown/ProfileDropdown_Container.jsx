import ProfileDropdown_Presenter from './ProfileDropdown_Presenter';
import axios from 'axios';
import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../../../utils/auth-context';

const server_url = import.meta.env.VITE_SERVER_URL;

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
  });

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
