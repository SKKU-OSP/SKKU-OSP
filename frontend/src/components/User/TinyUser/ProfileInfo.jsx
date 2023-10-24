import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';
import { BsGithub } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';

const server_url = import.meta.env.VITE_SERVER_URL;

function ProfileInfo(props) {
  const info = props.userInfo;
  const isEdit = props.isEdit;
  const { username } = useParams();
  const [userInfo, setUserInfo] = useState();
  const [editing, setEditing] = useState(false);
  const [editUserInfo, setEditUserInfo] = useState();

  useEffect(() => setUserInfo(info), [info]);

  const updatePostProfileInfo = async (editIntroduction) => {
    const postUrl = server_url + '/user/api/profile-intro/' + username + '/';
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
            <img src={server_url + userInfo.photo} className="info_img" />
          </div>
          <div className="d-flex flex-column info_right">
            {isEdit && (
              <div className="d-flex flex-row justify-content-end info_button">
                {editing ? (
                  <button className="info_btn-1" onClick={handleSaveClick}>
                    <span className="info_btn-1-text">프로필 저장</span>
                  </button>
                ) : (
                  <button className="info_btn-2" onClick={handleEditClick}>
                    <span className="info_btn-2-text">프로필 수정</span>
                  </button>
                )}
              </div>
            )}
            <div className="info_username">
              <span className="username">{userInfo.user.username}</span>
            </div>
            <div className="d-flex flex-row info_github">
              <BsGithub />
              <a href={`https://github.com/${userInfo.github_id}`} target="_blank" className="github_username">
                {userInfo.github_id}
              </a>
            </div>
            {editing ? (
              <textarea
                name="introduction"
                rows="5"
                style={{ width: '100%', whiteSpace: 'pre-wrap' }}
                value={editUserInfo.introduction}
                onChange={handleInputChange}
              />
            ) : (
              <div className="info_introduction">
                {userInfo.introduction.length > 0 ? (
                  <>
                    {userInfo.introduction.split('\n').map((line, idx) => {
                      return (
                        <span key={`introduction-${idx}`}>
                          {line}
                          <br />
                        </span>
                      );
                    })}
                  </>
                ) : (
                  <>자기소개를 작성하지 않았습니다.</>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}
export default ProfileInfo;
