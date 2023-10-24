import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';

import { FaUniversity } from 'react-icons/fa';
import { BsFillCheckCircleFill, BsGithub } from 'react-icons/bs';
import { MdAlternateEmail } from 'react-icons/md';

import LoaderIcon from 'react-loader-icon';

const server_url = import.meta.env.VITE_SERVER_URL;
function OwnerInfo() {
  const { username } = useParams();
  const [ownerInfo, setOwnerInfo] = useState();
  useEffect(() => {
    const getOwnerInfo = async () => {
      try {
        const infoUrl = server_url + '/user/api/profile-info/' + username;
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
          <div className="d-flex flex-column info-email">
            <div className="d-flex justify-content-center">
              <MdAlternateEmail size={24} />
            </div>
            <span className="email">{ownerInfo.personal_email}</span>
          </div>
          <div className="d-flex flex-column info-github">
            <div className="d-flex justify-content-center">
              <BsGithub size={24} />
            </div>
            <span className="name">{ownerInfo.github_id}</span>
          </div>
        </div>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}
export default OwnerInfo;
