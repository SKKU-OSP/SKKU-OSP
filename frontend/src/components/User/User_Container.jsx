import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../utils/auth';
import AuthContext from '../../utils/auth-context';
import User_Presenter from './User_Presenter';
const server_url = import.meta.env.VITE_SERVER_URL;

function User_Container() {
  const [userInfo, setUserInfo] = useState();
  const [isEdit, setIsEdit] = useState(false);
  const [isChange, setIsChange] = useState(false);
  const [open_lvl, setOpen_lvl] = useState(undefined);
  const { username } = useParams();
  const loginname = useContext(AuthContext).username;

  //   const handleError = (message, url) => {
  //     alert(message);
  //     navigate(url);
  //   };

  useEffect(() => {
    const getProfileInfo = async () => {
      const getUrl = server_url + '/user/api/profile-intro/' + username + '/';
      try {
        const response = await axiosInstance.get(getUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setUserInfo(res.data.account);
        }
      } catch (error) {
        console.error(error);
      }
    };
    setIsEdit(username === loginname);
    getProfileInfo();
  }, [username, isChange]);

  useEffect(() => {
    const getAccountPrivacy = async () => {
      try {
        const AccountPrivacyGetUrl = server_url + '/user/api/account-privacy/' + username + '/';
        const response = await axios.get(AccountPrivacyGetUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setOpen_lvl(res.data.open_lvl);
        }
      } catch (error) {}
    };
    getAccountPrivacy();
  }, []);

  return (
    <User_Presenter
      userInfo={userInfo}
      isEdit={isEdit}
      isChange={isChange}
      setIsChange={setIsChange}
      open_lvl={open_lvl}
    />
  );
}

export default User_Container;
