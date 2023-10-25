import { useContext, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BsGithub } from 'react-icons/bs';
import axios from 'axios';

import classes from './Login.module.css';
import AuthContext from '../../utils/auth-context';
import { setExpiration } from '../../utils/auth';

const client_id = import.meta.env.VITE_CLIENT_ID;
const github_login_url = `oauth/authorize?client_id=${client_id}`;
const domain_url = import.meta.env.VITE_SERVER_URL;
const login_url = `${domain_url}/accounts/login/user/`;

function Login() {
  const location = useLocation();
  const [error, setError] = useState(location.state?.error);
  const navigate = useNavigate();
  const usernameInputRef = useRef();
  const passwordInputRef = useRef();

  const { setUser } = useContext(AuthContext);

  const sendLoginRequest = async () => {
    try {
      if ((usernameInputRef.current.value === '') | (passwordInputRef.current.value === '')) return;
      const data = { username: usernameInputRef.current.value, password: passwordInputRef.current.value };
      const response = await axios.post(login_url, data);
      const res = response.data;

      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      setExpiration(); // 로컬스토리지에 expiration 저장
      setUser();
      navigate('/community');
    } catch (error) {
      console.log('error', error);
      setError(error.message);
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();
    sendLoginRequest();
  };

  const handleGithubLogin = () => {
    console.log('handleGithubLogin');
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${client_id}`;
  };

  return (
    <div style={{ maxWidth: '460px', margin: 'auto' }}>
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-50" />
      </div>
      {error && (
        <div className="text-center mb-3">
          <strong>{error}</strong>
        </div>
      )}

      <form method="post" onSubmit={handleLogin}>
        <div className="form-floating mb-3">
          <input
            ref={usernameInputRef}
            type="text"
            className="form-control"
            name="username"
            id="username"
            placeholder="exampleusername"
            required
          />
          <label htmlFor="username">Username</label>
        </div>
        <div className="form-floating mb-3">
          <input
            ref={passwordInputRef}
            type="password"
            className="form-control"
            name="password"
            id="password"
            placeholder="examplepw"
            autoComplete="off"
            required
          />
          <label htmlFor="password">Password</label>
        </div>
        <div className="d-flex flex-column">
          <button type="submit" className="btn btn-primary mb-2">
            Login
          </button>
          {github_login_url ? (
            <button type="button" className="btn btn-dark mb-2" onClick={handleGithubLogin}>
              <BsGithub /> Start with Github
            </button>
          ) : (
            <div>죄송합니다. 현재 회원가입 및 GitHub 로그인이 불가능합니다.</div>
          )}
        </div>
      </form>
      <div className="d-flex justify-content-between flex-wrap">
        <div className={classes.weakText}>
          <Link to="/accounts/find">계정 찾기</Link>
          <span>|</span>
          <Link to="/accounts/password-reset">비밀번호 재설정</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
