import { useContext, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BsGithub } from 'react-icons/bs';
import axios from 'axios';
import ReactGA from 'react-ga4';

import classes from './Login.module.css';
import AuthContext from '../../utils/auth-context';
import LoginErrorModal from './LoginErrorModal';
import GithubLoginModal from './GithubLoginModal';
import LoginSelectModal from './LoginSelectModal';
import { tokenLoader, setExpiration } from '../../utils/auth';

const client_id = import.meta.env.VITE_CLIENT_ID;
const github_login_url = `oauth/authorize?client_id=${client_id}`;
const domain_url = import.meta.env.VITE_SERVER_URL;
const login_url = `${domain_url}/accounts/login/user/`;

function Login() {
  const location = useLocation();
  const [error, setError] = useState(location.state?.error);
  const [show, setShow] = useState(false);
  const [githubModalShow, setGithubModalShow] = useState(false);
  const [selectModalShow, setSelectModalShow] = useState(false);
  const navigate = useNavigate();
  const usernameInputRef = useRef();
  const passwordInputRef = useRef();

  const { setUser } = useContext(AuthContext);

  const sendLoginRequest = async () => {
    try {
      if ((usernameInputRef.current.value === '') | (passwordInputRef.current.value === '')) return;
      const token = tokenLoader();
      if (token !== null && token !== 'EXPIRED') {
        setUser();
        navigate('/community');
      } else {
        const data = { username: usernameInputRef.current.value, password: passwordInputRef.current.value };
        const response = await axios.post(login_url, data);
        const res = response.data;
        if (res.status == 'success') {
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          setExpiration(); // 로컬스토리지에 expiration 저장
          setUser();
          ReactGA.event({
            category: 'login',
            action: 'Success_Login',
            label: '로그인 성공'
          });
          navigate('/community');
        } else {
          setError(res.message);
          setShow(true);
        }
      }
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
    setSelectModalShow(true);
    // setGithubModalShow(true);
  };

  const handleDirectGithubLogin = () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${client_id}`;
  };

  const handleGithubIdChange = () => {
    setSelectModalShow(false);
    setGithubModalShow(true);
  };

  const handleGithubIdSubmit = async (studentId, githubId) => {
    try {
      const response = await axios.post(`${domain_url}/accounts/github_id/change/`, {
        student_data: studentId,
        github_id: githubId
      });
      const res = response.data;
      if (res.status === 'success') {
        alert('GitHub ID가 성공적으로 변경되었습니다.\n다시 로그인 해주시기 바랍니다.');
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error('GitHub ID 변경 실패', error);
      alert('서버 요청 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: 'auto' }}>
      <LoginErrorModal show={show} onShowLoginErrorModal={setShow} error={error} />
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-50" />
      </div>

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
          <button
            type="submit"
            className="btn btn-primary mb-2"
            style={{ backgroundColor: '#072A60', border: '#072A60', fontWeight: 'bold' }}
          >
            LOGIN
          </button>
          {github_login_url ? (
            <>
              <button type="button" className="btn btn-dark mb-2" onClick={handleGithubLogin}>
                <BsGithub /> Start with GitHub
              </button>
              <LoginSelectModal
                show={selectModalShow}
                onClose={() => setSelectModalShow(false)}
                onDirectLogin={handleDirectGithubLogin}
                onIdChange={handleGithubIdChange}
              />

              <GithubLoginModal
                show={githubModalShow}
                onShowGithubLoginModal={setGithubModalShow}
                onSubmitGithubId={handleGithubIdSubmit}
              />
            </>
          ) : (
            <div>죄송합니다. 현재 회원가입 및 GitHub 로그인이 불가능합니다.</div>
          )}
        </div>
      </form>
      <div className="d-flex justify-content-between flex-wrap">
        <div className={classes.weakText}>
          <Link onClick={handleGithubLogin}> 회원가입 </Link>
          <span> | </span>
          <Link to="/accounts/find">계정 찾기</Link>
          <span> | </span>
          <Link to="/accounts/password-reset">비밀번호 재설정</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
