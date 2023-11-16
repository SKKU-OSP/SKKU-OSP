import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';
import { BsGithub } from 'react-icons/bs';
import { IoAddCircle, IoReloadCircle } from 'react-icons/io5';
import LoaderIcon from 'react-loader-icon';

const server_url = import.meta.env.VITE_SERVER_URL;

function ProfileInfo(props) {
  const info = props.userInfo;
  const isEdit = props.isEdit;
  const { username } = useParams();
  const [userInfo, setUserInfo] = useState();
  const [editing, setEditing] = useState(false);
  const [editUserInfo, setEditUserInfo] = useState();
  const [imagePreview, setImagePreview] = useState();
  const [originalImage, setOriginalImage] = useState();
  const fileInput = useRef(null);

  useEffect(() => {
    setUserInfo(info);
    setImagePreview(info.photo);
    setOriginalImage(info.photo);
  }, [info]);

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
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInput.current.click();
  };

  const handleReloadImage = () => {
    console.log('before', imagePreview);
    setImagePreview(originalImage);
    console.log('after', originalImage);
    fileInput.current.value = null;
  };

  return (
    <>
      {userInfo ? (
        <div className="d-flex flex-row profile_info">
          <div className="d-flex flex-column align-items-center justify-content-center info_left">
            {isEdit ? (
              editing ? (
                <>
                  {imagePreview && <img src={imagePreview} className="info_img" />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    ref={fileInput}
                  />
                  <div className="d-flex justify-content-center">
                    <IoReloadCircle size={30} onClick={handleReloadImage} style={{ marginRight: '70px' }} />
                    <IoAddCircle size={30} onClick={handleClick} />
                  </div>
                </>
              ) : (
                <img src={server_url + userInfo.photo} className="info_img" />
              )
            ) : (
              <img src={server_url + userInfo.photo} className="info_img" />
            )}
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
