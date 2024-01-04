import Notification_Presenter from './Notification_Presenter';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function Notification_Container({ iconSize, showNoti, setShowNoti, setShowTeamApp }) {
  const [newAlert, setNewAlert] = useState(false);
  const [notiList, setNotiList] = useState([]);

  const handleClose = () => {
    setShowNoti(false);
  };

  const handleShow = () => {
    setShowNoti(true);
  };

  const checkNewAlert = async () => {
    try {
      const url = server_url + '/message/api/noti/list/';
      const response = await axios.get(url, getAuthConfig());
      const res = response.data;
      if (res.data.show_new_noti) {
        setNewAlert(true);
      }
      setNotiList(res.data.notifications);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // axios 요청으로 새로운 채팅 메시지 여부 확인
    checkNewAlert();
  }, []);

  return (
    <Notification_Presenter
      newAlert={newAlert}
      iconSize={iconSize}
      showNoti={showNoti}
      setShowTeamApp={setShowTeamApp}
      handleClose={handleClose}
      handleShow={handleShow}
      notiList={notiList}
      setNotiList={setNotiList}
    />
  );
}
