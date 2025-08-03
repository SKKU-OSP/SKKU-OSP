import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../utils/auth-context';
import LoaderIcon from 'react-loader-icon';

// 이 컴포넌트는 /new-dashboard로 접근했을 때
// 로그인된 사용자의 username을 포함한 경로로 리디렉션하는 역할을 합니다.
export default function NewDashBoardRedirect() {
  const { username } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (username) {
      navigate(`/new-dashboard/${username}`, { replace: true });
    }
    // username이 아직 로드되지 않았을 경우를 대비해, AuthContext의 로딩 상태를 확인하거나
    // username이 없을 경우 로그인 페이지로 보내는 로직을 추가할 수 있습니다.
    // 지금은 username이 있다고 가정하고 진행합니다.
  }, [username, navigate]);

  // 리디렉션이 일어나는 동안 잠시 보여줄 로딩 화면
  return <LoaderIcon style={{ marginTop: '20px' }} />;
}
