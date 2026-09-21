import React, { useEffect, useState } from 'react';

import axios from 'axios';

import { getAuthConfig, tokenLoader } from './auth';

const AuthContext = React.createContext({
  isLoggedIn: false,
  userId: undefined,
  username: undefined,
  githubUsername: undefined,
  name: undefined,
  photo: undefined,
  isSuperuser: false,
  canUseAiEvaluation: false,
  aiEvaluationAccessLoaded: false,
  setUser: () => {},
  unsetUser: () => {}
});

const server_url = import.meta.env.VITE_SERVER_URL;
const url = `${server_url}/user/api/info/`;
const aiEvaluationAccessUrl = `${server_url}/v2/ai-evaluation/access`;

export const AuthContextProvider = (props) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [canUseAiEvaluation, setCanUseAiEvaluation] = useState(false);
  const [aiEvaluationAccessLoaded, setAiEvaluationAccessLoaded] = useState(false);

  const [githubUsername, setGithubUsername] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState(null);

  const setUser = () => {
    // 로컬 스토리지에 로그인 설정되어있으면 로그인 상태 true 설정
    const token = tokenLoader();
    const setUserInfo = async () => {
      try {
        const config = getAuthConfig();
        const response = await axios.get(url, config);
        const res = response.data;
        if (res.status === 'success') {
          const account = res.data.account;
          console.log('Login User', account.user.id, account.user.username);
          setUserId(account.user.id);
          setUsername(account.user.username);
          setIsSuperuser(account.user.is_superuser);
          setPhoto(account.photo);
          setGithubUsername(account.github_id);
          setName(res.data.name);
          localStorage.setItem('username', account.user.username);
          try {
            const accessResponse = await axios.get(aiEvaluationAccessUrl, config);
            setCanUseAiEvaluation(Boolean(accessResponse.data?.data?.allowed));
          } catch {
            // 권한 조회에 실패하면 기능을 노출하지 않는 방향으로 처리한다.
            setCanUseAiEvaluation(false);
          } finally {
            setAiEvaluationAccessLoaded(true);
          }
        } else {
          console.log(res.errors);
          setUserId(null);
          setUsername(null);
          setIsSuperuser(null);
          setPhoto(null);
          setGithubUsername(null);
          setName(null);
          setCanUseAiEvaluation(false);
          setAiEvaluationAccessLoaded(true);
          localStorage.removeItem('username');
        }
      } catch (error) {
        console.log('setUserInfo error', error);
        setUserId(null);
        setUsername(null);
        setIsSuperuser(null);
        setPhoto(null);
        setGithubUsername(null);
        setName(null);
        setCanUseAiEvaluation(false);
        setAiEvaluationAccessLoaded(true);
        localStorage.removeItem('username');
      }
    };
    if (token) {
      setIsLoggedIn(true);
      setAiEvaluationAccessLoaded(false);
      setUserInfo();
    } else {
      console.log('no token');
      setCanUseAiEvaluation(false);
      setAiEvaluationAccessLoaded(true);
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
    setCanUseAiEvaluation(false);
    setAiEvaluationAccessLoaded(true);
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
        canUseAiEvaluation: canUseAiEvaluation,
        aiEvaluationAccessLoaded: aiEvaluationAccessLoaded,
        setUser: setUser,
        unsetUser: unsetUser
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
