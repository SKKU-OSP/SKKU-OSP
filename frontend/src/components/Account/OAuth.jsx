import { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoaderIcon from 'react-loader-icon';
import axios from 'axios';

import AuthContext from '../../utils/auth-context';
import { setExpiration } from '../../utils/auth';
import GitHubLoginModal from './GithubLoginModal';

function OAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [modalData, setModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    if (code) {
      // URL에서 code를 즉시 제거하여 중복 사용 방지
      const stateParam = searchParams.get('state');
      navigate(location.pathname, { replace: true });

      const state = stateParam ? JSON.parse(decodeURIComponent(stateParam)) : {};
      const server_url = import.meta.env.VITE_SERVER_URL;
      const url = `${server_url}/accounts/login/github/callback/?code=${code}`;

      axios
        .get(url)
        .then((response) => {
          const res = response.data;
          if (res.status === 'success') {
            if (state.isConnecting) {
              const { github_username, github_email } = res.data;
              navigate('/accounts/signup', {
                state: {
                  ssoData: state.ssoData,
                  githubCallbackData: { github_username, github_email },
                },
                replace: true,
              });
              return;
            }

            if (res.data?.access_token) {
              localStorage.setItem('access_token', res.data.access_token);
              localStorage.setItem('refresh_token', res.data.refresh_token);
              setExpiration();
              setUser();
              navigate('/community');
            } else {
              // 기존 로직 (현재 흐름에서는 거의 사용되지 않음)
              if (confirm(res.message)) {
                setModalData(res.data);
                setShowModal(true);
              } else {
                navigate('/accounts/signup', { state: { githubData: res.data } });
              }
            }
          } else {
            alert(res.message || 'GitHub 인증에 실패했습니다.');
            navigate('/accounts/login');
          }
        })
        .catch((error) => {
          console.error('Callback request error:', error);
          alert('일시적인 장애가 발생했습니다. 잠시 후 다시 시도해주세요.');
          navigate('/accounts/login');
        });
    }
  }, [location, navigate, setUser]);

  const handleGithubIdChange = (studentId, githubId) => {
    const server_url = import.meta.env.VITE_SERVER_URL;
    const url = `${server_url}/accounts/github_id/change/`;

    axios
      .post(url, { student_data: studentId, github_id: githubId })
      .then((response) => {
        if (response.data.status === 'success') {
          alert(response.data.message || 'GitHub ID가 성공적으로 변경되었습니다.');
          setShowModal(false);
          navigate('/accounts/login');
        } else {
          alert(response.data.message);
          setShowModal(true);
        }
      })
      .catch((error) => {
        console.error('GitHub ID 변경 오류:', error);
        alert('GitHub ID 변경 도중 오류가 발생하였습니다. 학번이 올바른지 확인해주세요.');
        navigate('/accounts/login');
      });
  };

  return (
    <>
      <LoaderIcon style={{ marginTop: '50px' }} />
      {showModal && modalData && (
        <GitHubLoginModal
          show={showModal}
          loginUsername={modalData?.github_username.value}
          onClose={setShowModal}
          onSubmitGithubId={handleGithubIdChange}
        />
      )}
    </>
  );
}

export default OAuth;
