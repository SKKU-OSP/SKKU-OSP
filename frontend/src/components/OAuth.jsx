import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import axios from 'axios';

function OAuth() {
  const location = useLocation();

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
          localStorage.setItem('isLoggedIn', true);
          window.location.href = '/community';
        })
        .catch((error) => {
          console.error('Callback request error:', error);
          alert('일시적인 장애가 발생했습니다. 잠시후 다시 시도해주세요.');
          window.location.href = '/accounts/login';
        });
    } else {
      console.error('Callback code is missing');
      localStorage.setItem('isLoggedIn', false);
    }
  }, [location.search]);

  return <div>gihub loading...</div>;
}

export default OAuth;
