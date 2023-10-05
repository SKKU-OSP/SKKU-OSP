import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ProfileInfo from './TinyUser/ProfileInfo';
import ProfileTab from './TinyUser/ProfileTab';
import { getAuthConfig } from '../../utils/auth';
import Spinner from 'react-bootstrap/Spinner';
import './User.css';

const server_url = import.meta.env.VITE_SERVER_URL;

function User_Presenter() {
  const [userInfo, setUserInfo] = useState();
  const [error_occur, setError] = useState(false);
  const { username } = useParams();
  useEffect(() => {
    const getProfileInfo = async () => {
      const getUrl = server_url + '/user/api/profile-intro/' + username;
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
  }, [username]);

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
