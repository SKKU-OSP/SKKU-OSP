import { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoaderIcon from 'react-loader-icon';

import axios from 'axios';
import AuthContext from '../../utils/auth-context';
import { setExpiration } from '../../utils/auth';

function OAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    // setUser를 의존성 배열에 넣으면 서버로 요청을 두번 보내게 되어 로그인 불가
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    if (code) {
      const server_url = import.meta.env.VITE_SERVER_URL;
      const url = `${server_url}/accounts/login/github/callback/?code=${code}`;
      axios
        .get(url)
        .then((response) => {
          // 처리 완료 후 리다이렉트 등 필요한 동작 수행
          const res = response.data;
          if (res.status === 'success') {
            if (res.data?.access_token) {
              // access_token 존재하면 로그인
              console.log(res.message);
              localStorage.setItem('access_token', res.data.access_token);
              localStorage.setItem('refresh_token', res.data.refresh_token);
              setExpiration(); // 로컬스토리지에 expiration 저장
              setUser();
              navigate('/community');
            } else {
              // 회원가입
              alert(res.message);
              // 데이터 유효성 검사: not null 체크
              const isValid = Object.values(res.data).every((value) => value !== null);
              if (isValid) {
                navigate('/accounts/signup', { state: res.data });
              } else {
                alert('GitHub 데이터를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.');
                navigate('/accounts/login');
              }
            }
          }
        })
        .catch((error) => {
          console.error('Callback request error:', error);
          alert('일시적인 장애가 발생했습니다. 잠시 후 다시 시도해주세요.');
          navigate('/accounts/login');
        });
    } else {
      console.error('Callback code is missing');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }, [location.search, navigate]);

  return <LoaderIcon style={{ marginTop: '50px' }} />;
}

export default OAuth;
