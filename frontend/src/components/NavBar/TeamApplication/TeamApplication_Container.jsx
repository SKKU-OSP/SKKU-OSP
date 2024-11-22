import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeamApplication_Presenter from './TeamApplication_Presenter';
import { getAuthConfig } from '../../../utils/auth';
import { tokenRemover } from '../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;
const domain_url = import.meta.env.VITE_SERVER_URL;
const logout_url = `${domain_url}/accounts/logout/`;

export default function TeamApplication_Container({ iconSize, showTeamApp, setShowTeamApp }) {
  const [newAlert, setNewAlert] = useState(false);
  const navigate = useNavigate();

  const checkNewAlert = async () => {
    try {
      const url = server_url + '/team/api/applications/';
      const response = await axios.get(url, getAuthConfig());
      const res = response.data;
      if (res.data.received.length > 0) {
        setNewAlert(true);
      }
      if (res.data.sent.length > 0) {
        setNewAlert(true);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const res = await axios.get(logout_url);
        console.log(res);
        tokenRemover();
        alert('로그인이 만료되었습니다. 로그인 화면으로 이동합니다.');
        navigate('/accounts/login');
        return;
      }
      console.log(error);
    }
  };

  useEffect(() => {
    // axios 요청으로 새로운 채팅 메시지 여부 확인
    checkNewAlert();
  }, []);
  return (
    <TeamApplication_Presenter
      newAlert={newAlert}
      iconSize={iconSize}
      showTeamApp={showTeamApp}
      setShowTeamApp={setShowTeamApp}
    />
  );
}
