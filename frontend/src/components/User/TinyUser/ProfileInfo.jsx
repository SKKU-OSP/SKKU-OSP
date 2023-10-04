import '../User.css';
import { BsGithub } from 'react-icons/bs';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { getAuthConfig } from '../../../utils/auth';
import { useNavigate, useParams } from 'react-router-dom';

function ProfileInfo(props) {
  const info = props.userInfo;
  const { username } = useParams();
  const [userInfo, setUserInfo] = useState();
  const [editing, setEditing] = useState(false);
  const [editUserInfo, setEditUserInfo] = useState();
  const server_url = import.meta.env.VITE_SERVER_URL;
  const postUrl = server_url + '/user/api/profile-intro/' + username + '/';
  const navigate = useNavigate();

  const moveDashBoard = () => {
    navigate('dashboard', {
      state: {
        username: username
      }
    });
  };

  useEffect(() => setUserInfo(info), [info]);

  const updatePostProfileInfo = async (editIntroduction) => {
    if (userInfo.introduction !== editIntroduction) {
      await axios.post(postUrl, { introduction: editIntroduction }, getAuthConfig());
    }
  };
  const handleEditClick = () => {
    setEditUserInfo(userInfo);
    setEditing(true);
  };
  const handleSaveClick = () => {
    updatePostProfileInfo(editUserInfo.introduction);
    setUserInfo(editUserInfo);
    setEditing(false);
  };
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditUserInfo({
      ...editUserInfo,
      [name]: value
    });
  };
  return (
    <>
      {userInfo ? (
        <div className="d-flex flex-row profile_info">
          <div className="d-flex align-items-center justify-content-center info_left">
            <div className="info_img" style={{ backgroundImage: `url(${userInfo.photo})` }} />
          </div>
          <div className="d-flex flex-column info_right">
            <div className="d-flex flex-row justify-content-end info_button">
              {editing ? (
                <button className="info_btn-1" onClick={handleSaveClick}>
                  <span className="info_btn-1-text">프로필 저장</span>
                </button>
              ) : (
                <>
                  <button className="info_btn-1" onClick={moveDashBoard}>
                    <span className="info_btn-1-text">대시보드</span>
                  </button>
                  <button className="info_btn-2" onClick={handleEditClick}>
                    <span className="info_btn-2-text">프로필 수정</span>
                  </button>
                </>
              )}
            </div>
            <div className="info_username">
              <span className="username">{userInfo.user.username}</span>
            </div>
            <div className="d-flex flex-row info_github">
              <BsGithub />

              <span className="github_username">{userInfo.github_id}</span>
            </div>
            {editing ? (
              <textarea name="introduction" rows="5" value={editUserInfo.introduction} onChange={handleInputChange} />
            ) : (
              <span className="info_introduction">{userInfo.introduction}</span>
            )}
          </div>
        </div>
      ) : (
        <Spinner animation="border" style={{ position: 'absolute', top: '50%', left: '50%' }} />
      )}
    </>
  );
}
export default ProfileInfo;
