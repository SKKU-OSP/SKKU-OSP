import { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import axios from 'axios';
import AuthContext from '../utils/auth-context';

function OAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    console.log('location.search', location.search);
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    console.log('code', code);

    if (code) {
      const server_url = import.meta.env.VITE_SERVER_URL;
      const url = `${server_url}/accounts/login/github/callback/?code=${code}`;

      axios
        .get(url)
        .then((response) => {
          // 처리 완료 후 리다이렉트 등 필요한 동작 수행
          console.log('Successful callback:', response);
          console.log(response.data.message);
          localStorage.setItem('access_token', response.data.data.access_token);
          localStorage.setItem('refresh_token', response.data.data.refresh_token);
          setUser();
          navigate('/community');
        })
        .catch((error) => {
          console.error('Callback request error:', error);
          alert('일시적인 장애가 발생했습니다. 잠시후 다시 시도해주세요.');
          navigate('/accounts/login');
        });
    } else {
      console.error('Callback code is missing');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }, [location.search, navigate, setUser]);

  return <div>gihub loading...</div>;
}

export default OAuth;
