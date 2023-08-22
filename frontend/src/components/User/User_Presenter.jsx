import './User.css';
import ProfileInfo from './TinyUser/ProfileInfo';
import ProfileTab from './TinyUser/ProfileTab';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useState } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../../utils/auth';
import Spinner from 'react-bootstrap/Spinner';

function User_Presenter() {
  const [userInfo, setUserInfo] = useState();
  const [error_occur, setError] = useState(false);
  const { username } = useParams();
  const server_url = import.meta.env.VITE_SERVER_URL;
  const getUrl = server_url + '/user/api/profile-intro/' + username;
  useEffect(() => {
    const getProfileInfo = async () => {
      try {
        const response = await axios.get(getUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
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
        <>잘못된 페이지입니다.</>
      ) : userInfo ? (
        <div className="d-flex flex-column col-md-9 col-12 user-container">
          <ProfileInfo userInfo={userInfo} />
          <ProfileTab githubId={userInfo.github_id} />
        </div>
      ) : (
        <Spinner animation="border" style={{ position: 'absolute', top: '50%', left: '50%' }} />
      )}
    </>
  );
}
export default User_Presenter;
