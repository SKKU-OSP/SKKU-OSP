import '../User.css';
import { BsGithub } from 'react-icons/bs';
import { useEffect } from 'react';
import axios from 'axios';
import { useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { getAuthConfig } from '../../../utils/auth';
import { useParams } from 'react-router-dom';

function ProfileInfo() {
  const { username } = useParams();
  const [userInfo, setUserInfo] = useState();
  const [error_occur, setError] = useState(false);
  const server_url = import.meta.env.VITE_SERVER_URL;
  const url = server_url + '/user/api/profile-intro/' + username;

  useEffect(() => {
    const getProfileInfo = async () => {
      try {
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          console.log('Get', res);
          setUserInfo(res.data.account);
        }
      } catch (error) {
        setError(true);
      }
    };
    getProfileInfo();
  }, []);
  return (
    <>
      {error_occur ? (
        <></>
      ) : (
        <>
          {userInfo ? (
            <div className="d-flex flex-row profile_info">
              <div className="d-flex align-items-center justify-content-center info_left">
                <div className="info_img" style={{ backgroundImage: `url(${userInfo.photo})` }}></div>
              </div>
              <div className="d-flex flex-column info_right">
                <div className="d-flex flex-row justify-content-end info_button">
                  <button className="info_btn-1">
                    <span className="info_btn-1-text">대시보드</span>
                  </button>
                  <button className="info_btn-2">
                    <span className="info_btn-2-text">프로필 수정</span>
                  </button>
                </div>
                <div className="info_username">
                  <span className="username">{userInfo.user.username}</span>
                </div>
                <div className="d-flex flex-row info_github">
                  <BsGithub />
                  <span className="github_username">{userInfo.github_id}</span>
                </div>
                <span className="info_introduction">{userInfo.introduction}</span>
              </div>
            </div>
          ) : (
            <Spinner animation="border" style={{ position: 'absolute', top: '50%', left: '50%' }} />
          )}
        </>
      )}
    </>
  );
}
export default ProfileInfo;
