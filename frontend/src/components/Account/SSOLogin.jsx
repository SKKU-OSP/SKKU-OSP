
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactGA from 'react-ga4';

import AuthContext from '../../utils/auth-context';
import { setExpiration } from '../../utils/auth';

const domain_url = import.meta.env.VITE_SERVER_URL;
const sso_login_url = `${domain_url}/accounts/login/sso/`;

// SSO를 통해 얻었다고 가정하는 더미 학생 정보
const dummyStudentData = {
  student_id: '2025123456',
  name: '성균관',
  email: 'skku@skku.edu',
  college: '소프트웨어대학',
  dept: '소프트웨어학과'
};

function SSOLogin() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [error, setError] = useState(null);

  const handleSSOLogin = async () => {
    try {
      // 1. 백엔드에 SSO 정보로 로그인 요청
      const response = await axios.post(sso_login_url, dummyStudentData);
      const res = response.data;

      if (res.status === 'success') {
        // 2-1. 기존 가입된 유저 -> 로그인 성공
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        setExpiration();
        setUser();
        ReactGA.event({
          category: 'login',
          action: 'Success_SSO_Login',
          label: 'SSO 로그인 성공',
        });
        navigate('/community');
      }
    } catch (error) {
      // 2-2. 가입되지 않은 유저 -> 회원가입 페이지로 이동
      if (error.response && error.response.status === 404) {
        console.log('SSO 인증 성공, 가입 필요');
        navigate('/accounts/signup', { state: { ssoData: dummyStudentData } });
      } else {
        console.error('SSO Login error', error);
        setError('SSO 로그인 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: 'auto', textAlign: 'center' }}>
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-50" />
      </div>
      <h2 className="mb-4">SSO 로그인</h2>
      <p className="mb-4">
        학교 SSO 계정으로 로그인합니다. <br />
        계정이 없는 경우, 회원가입 페이지로 이동합니다.
      </p>
      <button
        type="button"
        className="btn btn-primary w-100"
        style={{ backgroundColor: '#072A60', border: '#072A60', fontWeight: 'bold' }}
        onClick={handleSSOLogin}
      >
        SSO 계정으로 로그인
      </button>
      {error && <p className="mt-3 text-danger">{error}</p>}
    </div>
  );
}

export default SSOLogin;
