import axios from 'axios';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const serverUrl = import.meta.env.VITE_SERVER_URL;
function AccountFind() {
  const emailRef = useRef();
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const findAccount = async (event) => {
    event.preventDefault();
    try {
      if (emailRef.current.value === '') return;
      const data = { email: emailRef.current.value };
      console.log(data);

      const postUrl = serverUrl + '/accounts/find-account/';
      const response = await axios.post(postUrl, data);
      const res = response.data;
      if (res.status === 'success') {
        navigate('done');
      } else {
        console.log(res.message);
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
        {!error && <strong>이메일을 입력하여 계정을 찾을 수 있습니다.</strong>}
        {error && <strong>{error}</strong>}
      </div>
      <form method="post" onSubmit={findAccount}>
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
            찾기
          </button>
        </div>
      </form>
    </div>
  );
}

export default AccountFind;
