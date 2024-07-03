import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';
import { BsGithub } from 'react-icons/bs';
import { IoAddCircle, IoReloadCircle, IoCloseCircle } from 'react-icons/io5';
import LoaderIcon from 'react-loader-icon';

import QnAModal from './Frame/QnAModal';

const server_url = import.meta.env.VITE_SERVER_URL;

function ProfileInfo(props) {
  const { isEdit, isChange, setIsChange } = props;
  const { username } = useParams();
  const [userInfo, setUserInfo] = useState();
  const [editing, setEditing] = useState(false);
  const [editUserInfo, setEditUserInfo] = useState();
  const [imagePreview, setImagePreview] = useState();
  const [imageFile, setImageFile] = useState(null);
  const fileInput = useRef(null);
  const [QnAShow, setQnAShow] = useState(false);

  useEffect(() => {
    setUserInfo(props.userInfo);
  }, [props]);

  const updatePostProfileInfo = async (editIntroduction) => {
    const postUrl = server_url + '/user/api/profile-intro/' + username + '/';
    if (userInfo.introduction !== editIntroduction) {
      await axios.post(postUrl, { introduction: editIntroduction }, getAuthConfig());
    }
  };

  const updatePostProfileImage = async (imageFile) => {
    const postUrl = server_url + '/user/api/profile-image/' + username + '/';
    const formData = new FormData();
    formData.append('photo', imageFile);
    try {
      await axios.post(postUrl, formData, getAuthConfig());
    } catch (error) {
      console.error('Error during file upload', error);
    }
  };

  const updatePostProfileDefaultImage = async () => {
    const postUrl = server_url + '/user/api/profile-default-image/' + username + '/';
    const formData = new FormData();
    try {
      await axios.post(postUrl, formData, getAuthConfig());
    } catch (error) {
      console.error('Error during file upload', error);
    }
  };

  const handleEditClick = () => {
    setEditUserInfo(userInfo);
    setImagePreview(null);
    setImageFile(null);
    setEditing(true);
  };
  const handleSaveClick = async () => {
    if (editUserInfo.introduction !== userInfo.introduction) {
      await updatePostProfileInfo(editUserInfo.introduction);
    }
    if (imageFile) {
      await updatePostProfileImage(imageFile);
    }
    if (imagePreview === 'default') {
      await updatePostProfileDefaultImage();
    }
    if (editUserInfo.introduction !== userInfo.introduction || imageFile || imagePreview === 'default') {
      setIsChange(!isChange);
    }
    setImagePreview(null);
    setImageFile(null);
    setEditing(false);
  };

  const OnHandleQnAShow = () => setQnAShow(true);

  const OnHandleQnAClose = () => setQnAShow(false);

  const OnHandleQnASaveClose = (modalQnA) => {
    console.log('Saved QnA:', modalQnA);
    setQnAShow(false);
  };

  const handleIntroChange = (event) => {
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
        setImageFile(file);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputImage = () => {
    fileInput.current.click();
  };

  const handleReloadImage = () => {
    setImagePreview(null);
    setImageFile(null);
    fileInput.current.value = null;
  };

  const handleDeleteImage = () => {
    setImagePreview('default');
    setImageFile(null);
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
                  {imagePreview ? (
                    <img src={imagePreview} className="info_img" />
                  ) : (
                    <img src={server_url + userInfo.photo} className="info_img" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    ref={fileInput}
                  />
                  <div className="d-flex w-75 justify-content-between align-items-center pt-1">
                    <IoReloadCircle size={30} onClick={() => handleReloadImage()} style={{ cursor: 'pointer' }} />
                    <IoAddCircle size={30} onClick={() => handleInputImage()} style={{ cursor: 'pointer' }} />
                    <IoCloseCircle size={30} onClick={() => handleDeleteImage()} style={{ cursor: 'pointer' }} />
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
                  <button className="info_btn" onClick={handleSaveClick}>
                    <span className="info_btn-text">프로필 저장</span>
                  </button>
                ) : (
                  <button className="info_btn" onClick={handleEditClick}>
                    <span className="info_btn-text">프로필 수정</span>
                  </button>
                )}
              </div>
            )}
            <div className="d-flex flex-row justify-content-between align-items-center">
              <div className="info_username">
                <span className="username">{userInfo.user.username}</span>
              </div>
              <button className="info_qna" onClick={OnHandleQnAShow}>
                <span className="info_qna-text">문의하기</span>
              </button>
              <QnAModal
                Show={QnAShow}
                OnHandleQnAClose={OnHandleQnAClose}
                OnHandleQnASaveClose={OnHandleQnASaveClose}
              />
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
                className="info_editing-textarea"
                value={editUserInfo.introduction}
                onChange={handleIntroChange}
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
