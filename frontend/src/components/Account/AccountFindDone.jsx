import { Link } from 'react-router-dom';

function AccountFindDone() {
  return (
    <div style={{ maxWidth: '460px', margin: 'auto' }}>
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-50" />
      </div>
      <div className="my-3">계정정보에 대한 이메일을 발송 했습니다.</div>
      <div className="my-3">
        <p>이메일을 받지 못했다면</p>
        <p>1. 이메일 주소를 확인해주세요.</p>
        <p>2. 스팸메일함을 확인해주세요.</p>
        <p>3. 관리자에게 문의하세요.</p>
      </div>
      <div className="text-end">
        <Link to="/accounts/login" className="btn btn-primary">
          로그인 화면으로
        </Link>
      </div>
    </div>
  );
}

export default AccountFindDone;
