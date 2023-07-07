import { useState } from 'react';
import { BsGithub } from 'react-icons/bs';
import classes from './Login.module.css';

const client_id = import.meta.env.VITE_CLIENT_ID;
function Login() {
  const [error, setError] = useState(false);
  const github_login_url = `https://github.com/login/oauth/authorize?client_id=${client_id}`;

  const handleLogin = () => {
    setError('로그인 시도');
  };

  const handleGithubLogin = () => {
    console.log('handleGithubLogin');
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${client_id}`;
  };

  return (
    <div className="container d-flex justify-content-center my-5">
      <div className="col-lg-3 col-6">
        <div className="d-flex justify-content-center mb-3">
          <img src="/images/logo.svg" alt="Logo" className="w-50" />
        </div>
        {error && (
          <div className="text-center mb-3">
            <strong>{error}</strong>
          </div>
        )}

        <div>
          <div className="form-floating mb-3">
            <input
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
            <button type="submit" className="btn btn-primary mb-2" onClick={handleLogin}>
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
        </div>
        <div className="d-flex justify-content-between flex-wrap">
          <div className={classes.weakText}>
            <a href="/accounts/find_account/">계정 찾기</a>
            <span>|</span>
            <a href="/accounts/password_reset/">비밀번호 재설정</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;