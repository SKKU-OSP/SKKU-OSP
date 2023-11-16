import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';

import { FaUniversity } from 'react-icons/fa';
import { BsFillCheckCircleFill, BsGithub } from 'react-icons/bs';
import { MdAlternateEmail } from 'react-icons/md';
import Form from 'react-bootstrap/Form';
import LoaderIcon from 'react-loader-icon';

const server_url = import.meta.env.VITE_SERVER_URL;
function OwnerInfo() {
  const { username } = useParams();
  const [ownerInfo, setOwnerInfo] = useState();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(true);
  const handlePublicSwitchChange = (checked, type) => {
    if (type === 0) setIsProfileOpen(checked);
    else setIsActivityOpen(checked);
  };
  useEffect(() => {
    const getOwnerInfo = async () => {
      try {
        const infoUrl = server_url + '/user/api/profile-info/' + username + '/';
        const response = await axios.get(infoUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setOwnerInfo(res.data.student);
        }
      } catch (error) {}
    };
    getOwnerInfo();
  }, []);

  return (
    <>
      {ownerInfo ? (
        <div className="d-flex flex-column profile-owner-info">
          <div className="d-flex flex-column info-university">
            <div className="d-flex justify-content-center">
              <FaUniversity size={24} />
            </div>
            <span className="info-uniName">성균관대학교</span>
            <span className="info-uniMajor">{ownerInfo.dept}</span>
            <div className="d-flex flex-row justify-content-center gap-1 info-uniId">
              <span className="uniId">{ownerInfo.id}</span>
              <BsFillCheckCircleFill size={16} />
            </div>
          </div>
          <div className="d-flex flex-column info">
            <div className="d-flex justify-content-center">
              <MdAlternateEmail size={24} />
            </div>
            <span className="title">{ownerInfo.personal_email}</span>
          </div>
          <div className="d-flex flex-column info">
            <div className="d-flex justify-content-center">
              <BsGithub size={24} />
            </div>
            <span className="title">{ownerInfo.github_id}</span>
          </div>
          <div className="d-flex flex-column info">
            <span className="title">프로필 공개 범위 설정</span>
            <div className="d-flex justify-content-center align-items-center">
              <Form>
                <Form.Check
                  type="switch"
                  id="isOpenProfile"
                  label="프로필 공개 설정"
                  onChange={(e) => handlePublicSwitchChange(e.target.checked, 0)}
                  checked={isProfileOpen}
                />
                <Form.Check
                  type="switch"
                  id="isOpenActivity"
                  label="활동 공개"
                  disabled={!isProfileOpen}
                  onChange={(e) => handlePublicSwitchChange(e.target.checked, 1)}
                  checked={!isProfileOpen ? false : isActivityOpen}
                />
              </Form>
            </div>
          </div>
        </div>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}
export default OwnerInfo;
