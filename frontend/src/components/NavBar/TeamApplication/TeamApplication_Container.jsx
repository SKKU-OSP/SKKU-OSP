import { useState, useEffect } from 'react';
import axios from 'axios';
import TeamApplication_Presenter from './TeamApplication_Presenter';
import { getAuthConfig } from '../../../utils/auth';
import axiosInstance from '../../../utils/axiosInterCeptor';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function TeamApplication_Container({ iconSize, showTeamApp, setShowTeamApp }) {
  const [newAlert, setNewAlert] = useState(false);

  const checkNewAlert = async () => {
    try {
      const url = server_url + '/team/api/applications/';
      const response = await axiosInstance.get(url, getAuthConfig());
      const res = response.data;
      if (res.data.received.length > 0) {
        setNewAlert(true);
      }
      if (res.data.sent.length > 0) {
        setNewAlert(true);
      }
    } catch (error) {
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
