import React, { useState, useEffect } from 'react';
import { tokenLoader, getAuthConfig } from './auth';

import axios from 'axios';

const AuthContext = React.createContext({
  isLoggedIn: false,
  userId: null,
  username: null,
  githubUsername: null,
  name: null,
  photo: null,
  isSuperuser: false,
  setUser: () => {},
  unsetUser: () => {}
});

const server_url = import.meta.env.VITE_SERVER_URL;
const url = `${server_url}/user/api/info`;

export const AuthContextProvider = (props) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [isSuperuser, setIsSuperuser] = useState(false);

  const [githubUsername, setGithubUsername] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState(null);

  const setUser = () => {
    console.log('setUser');
    // 로컬 스토리지에 로그인 설정되어있으면 로그인 상태 true 설정
    const token = tokenLoader();
    const setUserInfo = async () => {
      try {
        const config = getAuthConfig();
        const response = await axios.get(url, config);
        console.log('user info', response);
        const res = response.data;
        console.log('res.data.account.user.id', res.data.account.user.id);
        console.log('res.data.account.user.username', res.data.account.user.username);

        setUserId(res.data.account.user.id);
        setUsername(res.data.account.user.username);
        setIsSuperuser(res.data.account.user.is_superuser);
        setPhoto(res.data.account.photo);
        setGithubUsername(res.data.account.github_id);
        setName(res.data.name);
      } catch (error) {
        console.log('setUserInfo error', error);
      }
    };
    if (token) {
      setIsLoggedIn(true);
      setUserInfo();
    } else {
      console.log('no token');
    }
  };

  const unsetUser = () => {
    // 초기화
    setIsLoggedIn(false);
    setUserId(null);
    setUsername(null);
    setIsSuperuser(false);
    setName(null);
    setPhoto(null);
    setGithubUsername(null);
  };

  useEffect(() => {
    // 로컬 스토리지에 로그인 설정되어있으면 로그인 상태 true 설정
    setUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isLoggedIn,
        userId: userId,
        username: username,
        isSuperuser: isSuperuser,
        githubUsername: githubUsername,
        name: name,
        photo: photo,
        setUser: setUser,
        unsetUser: unsetUser
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
