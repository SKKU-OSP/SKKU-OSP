import { Link, useLocation } from 'react-router-dom';

function PasswordResetComplete() {
  const location = useLocation();
  const status = location.state;
  return (
    <div style={{ maxWidth: '460px', margin: 'auto' }}>
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-50" />
      </div>
      {status === 'success' && <p>비밀번호가 변경되었습니다.</p>}

      <div className="text-center">
        <Link to="/accounts/login" className="btn btn-primary">
          로그인 화면으로
        </Link>
      </div>
    </div>
  );
}

export default PasswordResetComplete;
