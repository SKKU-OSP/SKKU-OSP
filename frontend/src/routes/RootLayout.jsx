import { useContext, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import MainHeader from '../components/NavBar/MainHeader_Container';
import MainFooter from '../components/NavBar/MainFooter_Container';
import AuthContext, { AuthContextProvider } from '../utils/auth-context.jsx';
import { getTokenDuration, tokenLoader, tokenRemover } from '../utils/auth';

function RootLayout() {
  const { unsetUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const token = tokenLoader();

  useEffect(() => {
    if (!token) {
      return;
    }
    const expireLogin = () => {
      unsetUser();
      tokenRemover();
      navigate('/accounts/login', {
        state: {
          error: '로그인 시간이 만료되었습니다.'
        }
      });
    };
    if (token === 'EXPIRED') {
      expireLogin();
    }
    const tokenDuration = getTokenDuration();
    if (tokenDuration === null) return;
    setTimeout(() => {
      expireLogin();
    }, tokenDuration);
  }, [token]);

  return (
    <AuthContextProvider>
      <MainHeader />
      <Outlet />
      <MainFooter />
    </AuthContextProvider>
  );
}

export default RootLayout;
