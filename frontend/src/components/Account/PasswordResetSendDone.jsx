import { Link, useLocation } from 'react-router-dom';

function PasswordResetSendDone() {
  const location = useLocation();
  const status = location.state;
  return (
    <div style={{ maxWidth: '460px', margin: 'auto' }}>
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-50" />
      </div>
      {status === 'success' && (
        <>
          <div className="my-3">
            비밀번호 재설정에 대한 이메일을 발송했습니다. 링크를 통해 비밀번호를 재설정해주세요.
          </div>
          <div className="my-3">
            <p>이메일을 받지 못했다면</p>
            <p>1. 이메일 주소를 확인해주세요.</p>
            <p>2. 스팸메일함을 확인해주세요.</p>
            <p>3. 관리자에게 문의하세요.</p>
          </div>
        </>
      )}
      <div className="text-center">
        <Link to="/accounts/login" className="btn btn-primary">
          로그인 화면으로
        </Link>
      </div>
    </div>
  );
}

export default PasswordResetSendDone;
