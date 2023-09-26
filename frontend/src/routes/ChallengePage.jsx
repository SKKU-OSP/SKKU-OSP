import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import classes from './ChallengePage.module.css';
import { FaTrophy } from 'react-icons/fa';
import AuthContext from '../utils/auth-context';

const serverUrl = import.meta.env.VITE_SERVER_URL;

const ChallengePage = () => {
  const [achievements, setAchievements] = useState([]);
  const [total, setTotal] = useState(1);
  const { userId } = useContext(AuthContext);

  useEffect(() => {
    if (userId) {
      try {
        const url = serverUrl + `/challenge/api/list/${userId}`;
        const getAchievements = async () => {
          const response = await axios.get(url);
          const res = response.data;
          if (res.status === 'success') {
            setTotal(res.data.total_accounts);
            setAchievements(res.data.achievements);
            console.log(res.data.achievements);
          } else {
            console.log(res.message);
          }
        };
        getAchievements();
      } catch (error) {
        console.log('error', error);
      }
    }
  }, [userId]);

  let numAchieved = achievements.filter((obj) => obj.acheive_date !== null).length;
  let totalnum = Math.max(achievements.length, 1);

  const progressWidth = Math.round((numAchieved / totalnum) * 100);
  const colorMap = { 1: '#DB944B', 2: '#D9D9D9', 3: '#F9D978' };

  return (
    <>
      <div className="col-md-9">
        <div className={classes.ChallengeList}>
          <div className={classes.ChallengeProgressTitle}>
            도전과제 진행률: {numAchieved}/{totalnum}
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
                const hour = Number(prog.acheive_date.split('-')[2].split('T')[1].split(':')[0]);
                const minute = prog.acheive_date.split('-')[2].split('T')[1].split(':')[1];
                return (
                  <div key={prog.id}>
                    <div className={classes.AchievedItem}>
                      <div>
                        <div className={classes.ImgName}>
                          <FaTrophy size="48" style={{ color: `${colorMap[prog.challenge.tier]}` }} className="me-3" />
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
                        {hour < 12 ? (
                          <span className={classes.ChallengeDate}>
                            {year}.{month}.{day} 완료
                          </span>
                        ) : (
                          <span className={classes.ChallengeDate}>
                            {year}.{month}.{day} 완료
                          </span>
                        )}
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
          <div style={{ width: '1px', backgroundColor: '#b0b0b0' }}></div>
          <div className={classes.Unachieved}>
            <div className={classes.UnachievedTitle}>진행중인 도전과제</div>
            {achievements
              .filter((obj) => obj.acheive_date === null)
              .map((prog) => {
                return (
                  <div key={prog.id}>
                    <div className={classes.UnachievedItem}>
                      <div>
                        <div className={classes.ImgName}>
                          <FaTrophy size="48" style={{ color: `${colorMap[prog.challenge.tier]}` }} className="me-3" />
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
                          {(prog.progress / prog.challenge.max_progress) * 100}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChallengePage;
