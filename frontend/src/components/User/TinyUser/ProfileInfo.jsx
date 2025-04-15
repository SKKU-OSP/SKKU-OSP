import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../utils/auth';
import { BsGithub } from 'react-icons/bs';
import { IoAddCircle, IoReloadCircle, IoCloseCircle } from 'react-icons/io5';
import LoaderIcon from 'react-loader-icon';
import { FaAngleDown } from 'react-icons/fa';
import { Dropdown, DropdownButton } from 'react-bootstrap';

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
  const navigate = useNavigate();

  useEffect(() => {
    setUserInfo(props.userInfo);
  }, []);

  const updatePostProfileInfo = async (editIntroduction) => {
    const postUrl = server_url + '/user/api/profile-intro/' + username + '/';
    if (userInfo.introduction !== editIntroduction) {
      const data = await axiosInstance.post(postUrl, { introduction: editIntroduction }, getAuthConfig());
      setUserInfo((prev) => ({
        ...prev,
        introduction: editIntroduction
      }));
    }
  };

  const updatePostProfileImage = async (imageFile) => {
    const postUrl = server_url + '/user/api/profile-image/' + username + '/';
    const formData = new FormData();
    formData.append('photo', imageFile);
    try {
      await axiosInstance.post(postUrl, formData, getAuthConfig());
    } catch (error) {
      console.error('Error during file upload', error);
    }
  };

  const updatePostProfileDefaultImage = async () => {
    const postUrl = server_url + '/user/api/profile-default-image/' + username + '/';
    const formData = new FormData();
    try {
      await axiosInstance.post(postUrl, formData, getAuthConfig());
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

  const OnHandleQnASaveClose = () => {
    console.log('Successfully Save QnA');
    setQnAShow(false);
  };

  const handleIntroChange = (event) => {
    const { name, value } = event.target;
    const totalLines = (value.match(/\n/g) || []).length;
    if (value.length <= 100 && totalLines <= 4) {
      setEditUserInfo({
        ...editUserInfo,
        [name]: value
      });
    } else if (totalLines > 4) {
      const lines = value.split('\n').slice(0, 5);
      setEditUserInfo({
        ...editUserInfo,
        [name]: lines.join('\n')
      });
    }
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

  const handleUserGuideClick = () => {
    window.open('https://equinox-rule-857.notion.site/SOSD-User-Manual-4283b4cc583e47298a42470a11be1c42');
  };

  return (
    <>
      {userInfo ? (
        <div className="profile_info">
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
                <button className="info_btn" onClick={handleUserGuideClick}>
                  <span className="info_btn-text">사용자 가이드</span>
                </button>
                {editing ? (
                  <button className="info_btn" onClick={handleSaveClick}>
                    <span className="info_btn-text">프로필 저장</span>
                  </button>
                ) : (
                  <button className="info_btn" onClick={handleEditClick}>
                    <span className="info_btn-text">프로필 수정</span>
                  </button>
                )}
                <DropdownButton
                  align="end"
                  title={
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <span>나의 활동</span>
                      <FaAngleDown style={{ marginLeft: '5px' }} />
                    </span>
                  }
                  className="info_dropdown"
                >
                  <Dropdown.Item eventKey="1" onClick={() => navigate('/community/activity/article')}>
                    내가 작성한 글
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="2" onClick={() => navigate('/community/activity/comment')}>
                    내가 작성한 댓글
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="3" onClick={() => navigate('/community/activity/scrap')}>
                    내가 스크랩한 글
                  </Dropdown.Item>
                </DropdownButton>
              </div>
            )}
            <div className="d-flex flex-row justify-content-between align-items-center">
              <div className="info_username">
                <span className="username">{userInfo.user.username}</span>
              </div>
              {isEdit && (
                <>
                  <button className="info_qna" onClick={OnHandleQnAShow}>
                    <span className="info_qna-text">문의하기</span>
                  </button>
                  <QnAModal
                    user={userInfo.user.username}
                    Show={QnAShow}
                    OnHandleQnAClose={OnHandleQnAClose}
                    OnHandleQnASaveClose={OnHandleQnASaveClose}
                  />
                </>
              )}
            </div>
            <div className="d-flex flex-row info_github">
              <BsGithub />
              <a
                href={`https://github.com/${userInfo.github_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="github_username"
              >
                {userInfo.github_id}
              </a>
            </div>
            {editing ? (
              <div className="d-flex flex-column">
                <textarea
                  name="introduction"
                  rows="5"
                  className="info_editing-textarea"
                  value={editUserInfo.introduction}
                  onChange={handleIntroChange}
                  maxLength={100}
                />
                <div className="text-end text-muted mt-1">
                  <small>
                    {editUserInfo.introduction?.length || 0}/100자 |{' '}
                    {editUserInfo.introduction?.split('\n').length || 1}
                    /5줄
                  </small>{' '}
                </div>
              </div>
            ) : (
              <div className="info_introduction">
                {userInfo.introduction?.length > 0 ? (
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
