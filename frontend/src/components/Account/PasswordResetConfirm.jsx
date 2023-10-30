import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const serverUrl = import.meta.env.VITE_SERVER_URL;
function PasswordResetConfirm() {
  const PW1Ref = useRef();
  const PW2Ref = useRef();
  const [error, setError] = useState(null);
  const [msg, setMSG] = useState(null);
  const navigate = useNavigate();
  const { uidb64, token } = useParams();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await axios.get(`${serverUrl}/accounts/reset/${uidb64}/${token}/`);
        const res = response.data;
        if (res.stauts === 'success') {
          setError(null);
        } else {
          setError(res.message);
        }
      } catch (err) {
        console.log(err.message);
        setError('유효하지 않은 링크입니다. 이미 사용했거나 만료되었습니다. 비밀번호 재설정을 다시 진행해주세요.');
      }
    };
    checkToken();
  }, [uidb64, token]);

  const sendReset = async (event) => {
    event.preventDefault();
    try {
      if (PW1Ref.current.value === '') {
        setMSG('새로운 비밀번호를 입력하지 않았습니다.');
        PW1Ref.current.focus();
        return;
      }
      if (PW2Ref.current.value === '') {
        setMSG('비밀번호 확인을 입력하지 않았습니다.');
        PW2Ref.current.focus();
        return;
      }
      if (PW1Ref.current.value !== PW2Ref.current.value) {
        setMSG('비밀번호가 일치하지 않습니다.');
        PW2Ref.current.focus();
        return;
      }
      const data = { password: PW1Ref.current.value };
      const postUrl = `${serverUrl}/accounts/reset/${uidb64}/${token}/`;
      const response = await axios.post(postUrl, data);
      const res = response.data;
      if (res.status === 'success') {
        setMSG(null);
        setError(null);
        navigate('/accounts/reset/done', { state: res.status });
      } else {
        setMSG(res.message);
      }
    } catch (err) {
      setMSG(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: 'auto' }}>
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-50" />
      </div>

      {!error && (
        <>
          <div>
            <strong>{msg ? msg : '비밀번호 재설정'}</strong>
          </div>
          <form method="post" onSubmit={sendReset}>
            <div className="form-floating mb-3">
              <input
                ref={PW1Ref}
                type="password"
                id="id_new_password1"
                className="form-control"
                name="new_password1"
                autoComplete="new-password"
                placeholder="examplepw"
                required
              />
              <label htmlFor="id_new_password1">새로운 비밀번호</label>
            </div>
            <div className="form-floating mb-3">
              <input
                ref={PW2Ref}
                type="password"
                id="id_new_password2"
                className="form-control"
                name="new_password2"
                autoComplete="new-password"
                placeholder="examplepw2"
                required
              />
              <label htmlFor="id_new_password2">비밀번호 확인</label>
            </div>
            <div className="d-flex flex-column">
              <button type="submit" className="btn btn-outline-primary mb-3">
                설정
              </button>
            </div>
          </form>
        </>
      )}
      {error && (
        <div>
          <strong>{error}</strong>{' '}
        </div>
      )}
    </div>
  );
}

export default PasswordResetConfirm;
