import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactGA from 'react-ga4';

import { FaTrophy } from 'react-icons/fa';

import AuthContext from '../utils/auth-context';
import classes from './ChallengePage.module.css';
import { tokenRemover } from '../utils/auth';

const serverUrl = import.meta.env.VITE_SERVER_URL;
const domain_url = import.meta.env.VITE_SERVER_URL;
const logout_url = `${domain_url}/accounts/logout/`;

const ChallengePage = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [total, setTotal] = useState(1);
  const { userId, username } = useContext(AuthContext);
  const updateUrl = serverUrl + `/challenge/api/update/${userId}/`;
  const Update = async () => {
    try {
      const response = await axios.get(updateUrl);
      const res = response.data;
      if (res.status === 'success') {
        console.log(res.status);
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
    }
  };

  const url = serverUrl + `/challenge/api/list/${userId}/`;
  const getAchievements = async () => {
    const response = await axios.get(url);
    const res = response.data;
    console.log('achievement: ', res);
    if (res.status === 'success') {
      setTotal(res.data.total_accounts);
      setAchievements(res.data.achievements);
    } else {
      console.log(res.message);
    }
  };

  const KCoinUrl = `http://kingocoin-dev.cs.skku.edu:8080/api/auth/platform?name=오픈소스플랫폼`;
  const getKCoinJWT = async () => {
    const response = await axios.get(KCoinUrl, {
      headers: {
        'Authorization-Temp': `bearer ${JWT}`
      }
    });
    console.log(response);
  };

  const secretJWTUrl = serverUrl + `/challenge/api/secret/${userId}/`;
  const getSecretJWT = async () => {
    console.log('getSecretJWT');
    console.log(username);
    const response = await axios.get(secretJWTUrl);
    const res = response.data;
    console.log(res);
  };

  // for admin

  const getChallegeListTest = async () => {
    const url = serverUrl + `/challenge/api/list/`;
    const response = await axios.get(url);
    const res = response.data;
    console.log('test', res.data);
    setAchievements(res.data.challenges);
  };

  useEffect(() => {
    if (username !== null) {
      Update();
      getAchievements();
      if (username === 'admin') {
        getChallegeListTest();
      }
      getSecretJWT();
      ReactGA.event({
        category: 'Page',
        action: 'Access_Challenge',
        label: '도전과제 접근'
      });
    } else {
      if (window.confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      } else {
        navigate(-1);
      }
      return;
    }
  }, [userId]);

  let numAchieved = 0;
  let totalnum = 1;
  if (username !== 'admin') {
    numAchieved = achievements.filter((obj) => obj.acheive_date !== null).length;
    totalnum = Math.max(achievements.length, 1);
  }

  const progressWidth = Math.round((numAchieved / totalnum) * 100);
  const colorMap = { 1: '#DB944B', 2: '#D9D9D9', 3: '#F9D978' };

  return (
    <>
      <div className="col-9">
        <div className="community-nav d-flex">
          <div className="nav nav-fill">
            <li className="nav-item selected-nav-item">
              <div>챌린지</div>
            </li>
          </div>
        </div>

        {username === 'admin' ? (
          <>
            <div className={classes.ChallengeList}>
              <div className={classes.ChallengeProgressTitle}>도전과제</div>
              <div className={classes.ChallengeProgressDetail}>
                <div className={classes.ChallengeText}>전체 도전과제: {totalnum}</div>
                <div className={classes.ChallengeText}>
                  도전과제 진행률: {numAchieved}/{totalnum}
                </div>
              </div>
              <div className={classes.Progress}>
                <div className={classes.ProgressBar} style={{ width: `${progressWidth}%` }}>
                  {progressWidth}%
                </div>
              </div>
            </div>
            <div className={classes.AchievementList}>
              <div className={classes.Achieved}>
                <div className={classes.AchievedTitle}>달성한 도전과제</div>
                {achievements.map((data) => {
                  return (
                    <div key={data.id}>
                      <div className={classes.AchievedItem}>
                        <div>
                          <div className={classes.ImgName}>
                            <FaTrophy size="48" style={{ color: `${colorMap[data.tier]}` }} className="me-3" />
                            <div className={classes.NameRate}>
                              <div className={classes.ChallengeName}>{data.name}</div>
                              <div className={classes.ChallengeRate}>{Math.round(0)}%의 사용자가 달성</div>
                            </div>
                          </div>
                          <span className={classes.ChallengeInstruction}>{data.description}</span>
                        </div>
                        <div className="d-flex flex-column">
                          <span className={classes.ChallengeDate}>{'2025.03.10'} 완료</span>
                          <div className={classes.Progress}>
                            <div className={classes.ProgressBar} style={{ width: `${100}%` }}>
                              {100}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={classes.Unachieved}>
                <div className={classes.AchievedTitle}>진행중인 도전과제</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={classes.ChallengeList}>
              <div className={classes.ChallengeProgressTitle}>도전과제</div>
              <div className={classes.ChallengeProgressDetail}>
                <div className={classes.ChallengeText}>전체 도전과제: {totalnum}</div>
                <div className={classes.ChallengeText}>
                  도전과제 진행률: {numAchieved}/{totalnum}
                </div>
              </div>
              <div className={classes.Progress}>
                <div className={classes.ProgressBar} style={{ width: `${progressWidth}%` }}>
                  {progressWidth}%
                </div>
              </div>
            </div>
            <div className={classes.AchievementList}>
              <div className={classes.Achieved}>
                <div className={classes.AchievedTitle}>달성한 도전과제</div>
                {achievements.map((prog) => {
                  if (prog.acheive_date !== null) {
                    const year = prog.acheive_date.split('-')[0].substring(2, 4);
                    const month = prog.acheive_date.split('-')[1];
                    const day = prog.acheive_date.split('-')[2].split('T')[0];
                    return (
                      <div key={prog.id}>
                        <div className={classes.AchievedItem}>
                          <div>
                            <div className={classes.ImgName}>
                              <FaTrophy
                                size="48"
                                style={{ color: `${colorMap[prog.challenge.tier]}` }}
                                className="me-3"
                              />
                              <div className={classes.NameRate}>
                                <div className={classes.ChallengeName}>{prog.challenge.name}</div>
                                <div className={classes.ChallengeRate}>
                                  {Math.round((prog.total_achievement / total) * 100)}%의 사용자가 달성
                                </div>
                              </div>
                            </div>
                            <span className={classes.ChallengeInstruction}>{prog.challenge.description}</span>
                          </div>

                          <div className="d-flex flex-column">
                            <span className={classes.ChallengeDate}>
                              {year}.{month}.{day} 완료
                            </span>
                            <div className={classes.Progress}>
                              <div className={classes.ProgressBar} style={{ width: `${100}%` }}>
                                {100}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
              <div className={classes.Unachieved}>
                <div className={classes.AchievedTitle}>진행중인 도전과제</div>
                {achievements
                  .filter((obj) => obj.acheive_date === null)
                  .map((prog) => {
                    return (
                      <div key={prog.id}>
                        <div className={classes.AchievedItem}>
                          <div>
                            <div className={classes.ImgName}>
                              <FaTrophy
                                size="48"
                                style={{ color: `${colorMap[prog.challenge.tier]}` }}
                                className="me-3"
                              />
                              <div className={classes.NameRate}>
                                <div className={classes.ChallengeName}>{prog.challenge.name}</div>
                                <div className={classes.ChallengeRate}>
                                  {Math.round((prog.total_achievement / total) * 100)}%의 사용자가 달성
                                </div>
                              </div>
                            </div>
                            <span className={classes.ChallengeInstruction}>{prog.challenge.description}</span>
                          </div>
                          <div className={classes.Progress}>
                            <div
                              className={classes.ProgressBar}
                              style={{ width: `${(prog.progress / prog.challenge.max_progress) * 100}%` }}
                            >
                              {Math.round((prog.progress / prog.challenge.max_progress) * 1000) / 10}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChallengePage;
