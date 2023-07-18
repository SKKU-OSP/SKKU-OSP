import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import axios from 'axios';
import classes from './ChallengePage.module.css';
import { FaTrophy } from 'react-icons/fa';
import Form from 'react-bootstrap/Form';
import Select from 'react-select';

const ChallengePage = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const url = serverUrl + '/challenge/api/list/72';
  const [achievements, setAchievements] = useState([]);
  const [total, setTotal] = useState(1);
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const options = [
    { value: 'Fastify', label: 'Fastify' },
    { value: 'Fastlane', label: 'Fastlane' },
    { value: 'Flask', label: 'Flask' }
  ];

  useEffect(() => {
    try {
      const getAchievements = async () => {
        const response = await axios.get(url);
        const res = response.data;
        console.log(res);
        if (res.status === 'success') {
          setTotal(res.data.total_accounts);
          setAchievements(res.data.achievements);
        } else {
        }
      };
      getAchievements();
    } catch (error) {
      console.log('error', error);
    }
  }, []);

  let numAchieved = achievements.filter((obj) => obj.acheive_date !== null).length;
  let totalnum = achievements.length;

  const progressWidth = Math.round((numAchieved / totalnum) * 100);
  const colorMap = { 1: '#DB944B', 2: '#D9D9D9', 3: '#F9D978' };

  return (
    <>
      <div className={'col-md-9'}>
        <Button variant="primary" onClick={handleShow}>
          팀 만들기
        </Button>
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>
              <h5>팀 만들기</h5>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-4">
              <span style={{ display: 'block' }}>팀 이름</span>
              <Form.Control type="email" style={{ display: 'block' }} />
            </div>
            <div className="mb-4">
              <span style={{ display: 'block' }}>팀 설명</span>
              <Form.Control as="textarea" rows={3} style={{ display: 'block' }} />
            </div>
            <div className="mb-4">
              <div>팀 대표 이미지</div>
              <div style={{ fontSize: 'small', color: 'gray', marginBottom: '10px' }}>
                png,jpg,jpeg 확장자만 지원합니다
              </div>
              <Form.Control type="file" multiple style={{ display: 'block' }} />
            </div>
            <div className="mb-4">
              <span style={{ display: 'block' }}>이미지 미리보기</span>
              <img src={'./chunsik.webp'} alt="" />
            </div>
            <div className="mb-4">
              <span style={{ display: 'block' }}>팀 분야</span>
              <Select isMulti options={options} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleClose}>
              저장
            </Button>
          </Modal.Footer>
        </Modal>
        <div className={classes.ChallengeTitle}>
          <div className={classes.ChallengeTitleContent}>챌린지</div>
        </div>
        <div className={classes.ChallengeList}>
          <h4>도전과제</h4>
          <div className={classes.ChallengeListWrapper}>
            <div className={classes.ChallengListContent}>전체 도전과제: {numAchieved}</div>
            <div className={classes.ChallengListContent}>
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
                return (
                  <div key={prog.id}>
                    <div className={classes.UnachievedItem}>
                      <div className={classes.ImgName}>
                        <FaTrophy size="80" style={{ color: `${colorMap[prog.challenge.tier]}` }} />
                        <div className={classes.NameRate}>
                          <div className={classes.ChallengeName}>{prog.challenge.name}</div>
                          <div className={classes.ChallengeRate}>
                            {Math.round((prog.total_achievement / total) * 100)}%의 사용자가 이 도전과제를 달성했습니다.
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={classes.ChallengeInstruction}>{prog.challenge.description}</span>
                        <span className={classes.ChallengeDate}>{prog.acheive_date}</span>
                      </div>
                      <div className={classes.Progress}>
                        <div className={classes.ProgressBar} style={{ width: `${100}%` }}>
                          {100}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
          <div className={classes.Unachieved}>
            <div className={classes.UnachievedTitle}>진행중인 도전과제</div>
            {achievements
              .filter((obj) => obj.acheive_date === null)
              .map((prog) => {
                return (
                  <div key={prog.id}>
                    <div className={classes.UnachievedItem}>
                      <div className={classes.ImgName}>
                        <FaTrophy size="80" style={{ color: `${colorMap[prog.challenge.tier]}` }} />
                        <div className={classes.NameRate}>
                          <div className={classes.ChallengeName}>{prog.challenge.name}</div>
                          <div className={classes.ChallengeRate}>
                            {Math.round((prog.total_achievement / total) * 100)}%의 사용자가 이 도전과제를 달성했습니다.
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={classes.ChallengeInstruction}>{prog.challenge.description}</span>
                        <span className={classes.ChallengeDate}>{prog.acheive_date}</span>
                      </div>
                      <div className={classes.Progress}>
                        <div className={classes.ProgressBar} style={{ width: `${prog.achieve}%` }}>
                          {prog.achieve}%
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
