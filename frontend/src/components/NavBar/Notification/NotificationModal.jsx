import { useContext, useEffect, useState } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import Modal from 'react-bootstrap/Modal';
import { BiCommentDetail } from 'react-icons/bi';
import { MdOutlinePortrait } from 'react-icons/md';
import { MdOutlineGroupAdd } from 'react-icons/md';
import { AiOutlineCheckSquare, AiOutlineLike } from 'react-icons/ai';
import { BsBoxArrowUpRight, BsFillCircleFill } from 'react-icons/bs';

import { getAuthConfig } from '../../../utils/auth';
import classes from './NotificationModal.module.css';
import AuthContext from '../../../utils/auth-context';

const serverUrl = import.meta.env.VITE_SERVER_URL;
const NotificationModal = ({ iconSize, show, handleClose, setShowTeamApp }) => {
  const [notiList, setNotiList] = useState([]);
  const [length, setLength] = useState(0);
  const [readAll, setReadAll] = useState(0);

  const { userId } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const url = serverUrl + '/message/api/noti/list/';
      const getNotifications = async () => {
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setNotiList(res.data.notifications);
        } else {
          console.log(res);
        }
      };
      getNotifications();
    } catch (error) {
      console.log('error', error);
    }
  }, [length]);

  const handleShowTeamApp = () => {
    setShowTeamApp(true);
  };

  const TypeImage = (type, read) => {
    if (type === 'team_apply_result' || type === 'team_apply')
      return <MdOutlinePortrait size="24" style={read === true ? { color: 'gray' } : { color: 'black' }} />;
    else if (type === 'team_invite' || type === 'team_invite_result')
      return <MdOutlineGroupAdd size="24" style={read === true ? { color: 'gray' } : { color: 'black' }} />;
    else if (type === 'comment')
      return (
        <BiCommentDetail size="24" style={read === true ? { color: 'gray', marginTop: '2px' } : { color: 'black' }} />
      );
    else if (type === 'articlelike')
      return <AiOutlineLike size="24" style={read === true ? { color: 'gray' } : { color: 'black' }} />;
  };

  const PrintUnread = (read) => {
    if (read === false)
      return (
        <div className="d-flex align-items-center ms-2">
          <BsFillCircleFill size="12" className={classes.Circle} />
        </div>
      );
    else return <div />;
  };

  const handleClickEvent = (type, route_id, team_name, noti_id) => {
    sendReadNoti(noti_id);
    if (type === 'team_apply_result' || type === 'team_apply') {
      handleClose();
      handleShowTeamApp();
    } else if (type === 'comment' || type === 'articlelike') {
      handleClose();
      navigate(`/community/article/${route_id}`);
    } else if (type === 'team_invite') {
      handleClose();
      navigate(`/community/team/${team_name}`);
    }
    setLength(length - 1);
  };

  const handleReadAll = (user_id) => {
    sendReadAll(user_id);
    setReadAll(readAll + 1);
    setNotiList((prev) =>
      prev.map((noti) => {
        noti.receiver_read = true;
        return noti;
      })
    );
  };
  //   AXIOS POST
  const sendReadAll = async (user_id) => {
    const data = { receiver__user: user_id };
    const ReadAllUrl = serverUrl + '/message/api/noti-read/';
    try {
      const response = await axios.post(ReadAllUrl, data, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        console.log(res.status, res.errors);
      } else {
        console.log(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendReadNoti = async (noti_id) => {
    const data = { target_noti: noti_id };
    const ReadNotiUrl = serverUrl + `/message/api/noti-read/${noti_id}/`;
    try {
      const response = await axios.post(ReadNotiUrl, data, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        console.log(res.status, res.errors);
      } else {
        console.log(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>알림내역</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className={classes.ReadAll}>
            <AiOutlineCheckSquare />
            <div className="ms-1" onClick={() => handleReadAll(userId)}>
              모두읽음
            </div>
          </div>
          <div className="d-flex justify-content-center">
            <div className={classes.ScrollContainer}>
              <ul style={{ paddingLeft: '0' }}>
                {notiList.map((noti) => (
                  <li
                    className={classes.ListItem}
                    key={noti.id}
                    onClick={() => handleClickEvent(noti.type, noti.route_id, noti.feedback.name, noti.id)}
                  >
                    {TypeImage(noti.type, noti.receiver_read)}
                    <div
                      className={classes.ItemBody}
                      style={noti.receiver_read === true ? { color: 'gray' } : { color: 'black' }}
                    >
                      {noti.body}
                    </div>
                    <BsBoxArrowUpRight
                      size="16"
                      className="mt-1"
                      style={noti.receiver_read === true ? { color: 'gray' } : { color: 'black' }}
                    />
                    {PrintUnread(noti.receiver_read)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default NotificationModal;
