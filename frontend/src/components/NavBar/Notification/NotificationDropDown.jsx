import Dropdown from 'react-bootstrap/Dropdown';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdOutlineNotificationsNone, MdOutlineGroupAdd } from 'react-icons/md';
import DropdownMenu from 'react-bootstrap/esm/DropdownMenu';
import { AiOutlineCheckSquare, AiOutlineLike } from 'react-icons/ai';
import { BiCommentDetail } from 'react-icons/bi';
import { MdOutlinePortrait } from 'react-icons/md';
import { BsBoxArrowUpRight } from 'react-icons/bs';
import { getAuthConfig } from '../../../utils/auth';
import { Height, Padding } from '@mui/icons-material';

export default function NotificationDropDown({ iconSize }) {
  const [notiList, setNotiList] = useState([]);

  const serverUrl = import.meta.env.VITE_SERVER_URL;
  useEffect(() => {
    try {
      const url = serverUrl + '/message/api/noti/list';

      const getNotifications = async () => {
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          console.log(res.data.notifications);
          setNotiList(res.data.notifications);
        } else {
          console.log(res);
        }
      };
      getNotifications();
    } catch (error) {
      console.log('error', error);
    }
  }, []);

  const TypeImage = (type) => {
    if (type === 'team_apply_result' || type === 'team_apply') return <MdOutlinePortrait size={iconSize} />;
    else if (type === 'team_invite' || type === 'team_invite_result') return <MdOutlineGroupAdd size={iconSize} />;
    else if (type === 'comment') return <BiCommentDetail size={iconSize} />;
    else if (type === 'articlelike') return <AiOutlineLike size={iconSize} />;
  };

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <a
      href=""
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    >
      {children}
    </a>
  ));

  return (
    <>
      <Dropdown>
        <Dropdown.Toggle as={CustomToggle}>
          <MdOutlineNotificationsNone size={iconSize} className="text-dark" />
        </Dropdown.Toggle>

        <DropdownMenu align="end" style={{ overflowY: 'auto', height: '15em' }}>
          <div className="d-flex flex-row align-items-center">
            <AiOutlineCheckSquare />
            <div className="ms-1">모두읽음</div>
          </div>
          {notiList.map((noti) => (
            <>
              <Dropdown.Item as="button" key={noti.id} style={{ width: '20em', padding: '0' }}>
                <Dropdown.Divider style={{ margin: '0' }} />
                <div
                  className="d-flex flex-row justify-content-center"
                  style={
                    noti.receiver_read == true
                      ? { backgroundColor: '#EBEBEB', color: '#9D9D9D', paddingTop: '6px', paddingBottom: '6px' }
                      : { paddingTop: '6px', paddingBottom: '6px' }
                  }
                >
                  {TypeImage(noti.type)}
                  <div style={{ width: '16em', whiteSpace: 'normal', wordBreak: 'break-all', fontSize: '1rem' }}>
                    {noti.body}
                  </div>
                  <BsBoxArrowUpRight size="16" />
                </div>
              </Dropdown.Item>
            </>
          ))}
        </DropdownMenu>
      </Dropdown>
    </>
  );
}
