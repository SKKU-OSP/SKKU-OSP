import axios from 'axios';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const serverUrl = import.meta.env.VITE_SERVER_URL;
function PasswordResetSend() {
  const UsernameRef = useRef();
  const emailRef = useRef();
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const sendReset = async (event) => {
    event.preventDefault();
    try {
      if (UsernameRef.current.value === '') return;
      if (emailRef.current.value === '') return;
      const data = { username: UsernameRef.current.value, email: emailRef.current.value };
      const postUrl = serverUrl + '/accounts/password-reset/';
      const response = await axios.post(postUrl, data);
      const res = response.data;
      if (res.status === 'success') {
        navigate('done', { state: res.status });
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: 'auto' }}>
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-50" />
      </div>
      <div>
        {!error && <strong>계정이름과 이메일을 확인하여 비밀번호 재설정 링크를 보내드립니다.</strong>}
        {error && <strong>{error}</strong>}
      </div>
      <form method="post" onSubmit={sendReset}>
        <div className="form-floating mb-3">
          <input
            ref={UsernameRef}
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
            ref={emailRef}
            type="email"
            className="form-control"
            name="email"
            id="email"
            placeholder="exampleemail"
            required
          />
          <label htmlFor="email">Email</label>
        </div>
        <div className="d-flex flex-column">
          <button type="submit" className="btn btn-outline-primary mb-3">
            재설정
          </button>
        </div>
      </form>
    </div>
  );
}

export default PasswordResetSend;
