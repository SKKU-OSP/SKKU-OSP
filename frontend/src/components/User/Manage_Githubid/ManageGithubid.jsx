import React, { useState, useEffect } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import axios from 'axios';

import { getAuthConfig } from '../../../utils/auth';
import classes from './ManageGihubid.module.css';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const apiDomain = 'https://api.github.com/users/';
function ManageGithubid() {
  const [userInfo, setUserInfo] = useState();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserGithub, setSelectedUserGithub] = useState('');
  const [github_value, setGithub_value] = useState('');
  const [show_status, setShow_status] = useState(false);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        let url = serverDomain + '/rank/api/user/';
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          const uniqueUsernames = new Set();
          const result = res.data.score_table
            .filter((item) => {
              if (uniqueUsernames.has(item.username)) {
                return false;
              } else {
                uniqueUsernames.add(item.username);
                return true;
              }
            })
            .map((item) => ({
              username: item.username,
              github_id: item.github_id
            }));
          setUserInfo(result);
        } else {
          console.log(res.message);
        }
      } catch (err) {
        console.log(err);
      }
    };
    getUserInfo();
  }, []);

  const checkUser = async (github_id) => {
    try {
      const response = await axios.get(apiDomain + github_id);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        alert(github_id + '는 유효하지 않은 github id입니다!');
        setShow_status(false);
        setGithub_value('');
      } else {
        console.error('Error fetching GitHub ID:', error);
      }
    }
  };

  const handleInput = (value) => {
    if (show_status) {
      setShow_status(false);
      setGithub_value('');
    } else {
      setGithub_value(value);
    }
  };

  const SelectUser = (user) => {
    setSelectedUser(user);
    setSelectedUserGithub(userInfo.filter((child) => child.username == user)[0].github_id);
    setGithub_value('');
  };

  const handleButton = () => {
    if (selectedUser == '') {
      alert('유저를 선택해주세요.');
    } else if (github_value == '') {
      alert('변경할 github id를 입력해주세요.');
    } else {
      setShow_status(true);
      checkUser(github_value);
      console.log(selectedUser);
    }
  };

  const UpdateGithubID = async () => {
    try {
      const homeurl = `${serverDomain}/home/api/update_github/`;
      const data = {
        old_owner: selectedUserGithub,
        new_owner: github_value
      };
      const response = await axios.post(homeurl, data, getAuthConfig());
      console.log(data);
      console.log(response.data);
      if (response.data.status == 'success') {
        setSelectedUser('');
        setSelectedUserGithub('');
        setGithub_value('');
        alert('Github ID가 성공적으로 변경되었습니다.');
        location.reload();
      } else {
        alert('오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error updating Github ID:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleButton2 = async () => {
    if (selectedUser && github_value) {
      UpdateGithubID();
    }
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
      &#x25bc;
    </a>
  ));
  CustomToggle.displayName = 'Toggle';

  const CustomMenu = React.forwardRef(({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
    const [value, setValue] = useState('');

    const filteredChildren = React.Children.toArray(children)
      .filter((child) => !value || (child.props.children && child.props.children.toLowerCase().startsWith(value)))
      .slice(0, 10);
    return (
      <div ref={ref} style={style} className={className} aria-labelledby={labeledBy}>
        <Form.Control
          autoFocus
          className="mx-3 my-2 w-auto"
          placeholder="Type to filter..."
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <ul className="list-unstyled">{filteredChildren}</ul>
      </div>
    );
  });
  CustomMenu.displayName = 'Menu';

  return (
    <>
      <div>
        <Dropdown>
          <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components">
            수정하려는 유저의 아이디 선택
          </Dropdown.Toggle>

          <Dropdown.Menu as={CustomMenu}>
            {userInfo &&
              userInfo.map((info) => (
                <Dropdown.Item key={info.username} onClick={() => SelectUser(info.username)}>
                  {info.username}
                </Dropdown.Item>
              ))}
          </Dropdown.Menu>
        </Dropdown>
        <div style={{ marginTop: '50px' }}>
          <div>선택한 유저 아이디</div>
          <div className={classes.user_box}>{selectedUser}</div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div>선택한 유저의 현재 Github 아이디</div>
          <div className={classes.user_box}>{selectedUserGithub}</div>
        </div>

        <div>
          <div style={{ marginTop: '20px' }}>변경할 Github 아이디</div>
          <Form.Control
            placeholder="변경할 Github 아이디를 입력해주세요."
            value={github_value}
            onChange={(e) => handleInput(e.target.value)}
            className={classes.input_box}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <button onClick={handleButton}>수정</button>
        </div>
        {show_status ? (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: ' 35px' }}>{github_value} 는 유효한 github id입니다</div>
            <div style={{ fontSize: ' 35px' }}>정말 {github_value} 로 변경하시겠습니까?</div>
            <button onClick={handleButton2}>진짜 수정</button>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </>
  );
}

export default ManageGithubid;
