import { useState } from 'react';
import { ProgressBar } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../utils/auth';
import './TestType.css';

const serverUrl = import.meta.env.VITE_SERVER_URL;

const qnaList = [
  {
    q: '😓 입사 안내를 기다리는 중! 신규 입사자들이 쭈뼛쭈뼛 모여 있다',
    answer: [
      { a: '입사 동기인가? 먼저 말 걸어봐야지', factor: ['E'], val: [33] },
      { a: '너무 어색행~ 누가 먼저 말 안 걸어주나?', factor: ['I'], val: [33] }
    ]
  },
  {
    q: '🍔 기다리던 점심 시간 밥 먹고 뭘 하면서 쉴까?',
    answer: [
      { a: '혼자 책을 읽거나 잠을 잔다', factor: ['I'], val: [33] },
      { a: '팀원들과 수다를 떤다', factor: ['E'], val: [33] }
    ]
  },
  {
    q: '🍺 첫 출근 기념으로 친구와 잡았던 저녁 약속이 취소됐다',
    answer: [
      { a: '피곤했는데 잘 됐다~ 집에서 쉰다', factor: ['I'], val: [33] },
      { a: '안 돼! 다른 친구에게 바로 연락한다', factor: ['E'], val: [33] }
    ]
  },
  {
    q: '📑 업무 가이드 문서를 받았는데 분량이 상당하다',
    answer: [
      { a: '처음부터 한 자 한 자 꼼꼼하게 읽는다', factor: ['N'], val: [33] },
      { a: '휘리릭 넘기며 궁금한 것부터 살펴본다', factor: ['S'], val: [33] }
    ]
  },
  {
    q: '🗓 오늘은 무슨 일을 할까?',
    answer: [
      { a: '신기능을 구상하는 과제', factor: ['S'], val: [33] },
      { a: '기존 기능을 보완하는 과제', factor: ['N'], val: [33] }
    ]
  },
  {
    q: '💭 옆 자리 동기가 밸런스 게임을 제안한다. "팔만대장경 읽기 VS 대장 내시경 8만 번 하기',
    answer: [
      { a: '아~ 안 해요', factor: ['S'], val: [33] },
      { a: '수면 내시경이에요? 금식해야 돼요?', factor: ['N'], val: [33] }
    ]
  },
  {
    q: '🎁 취업 기념 선물로 받고 싶은 건?',
    answer: [
      { a: '예쁘고 기억에 남을만한 것', factor: ['F'], val: [33] },
      { a: '요즘 가장 필요한 것', factor: ['T'], val: [33] }
    ]
  },
  {
    q: '💦 내 의견과 팀원들의 의견이 다르다. 어떻게 하지?',
    answer: [
      { a: '기분 상하지 않게 설득해 봐야지', factor: ['F'], val: [33] },
      { a: '논리적으로 설득해 봐야지', factor: ['T'], val: [33] }
    ]
  },
  {
    q: '👭 힘든 일이 생겼을 때 가장 먼저 찾게 되는 동료는?',
    answer: [
      { a: '현실적인 조언을 해주는 동료', factor: ['T'], val: [33] },
      { a: '위로와 공감을 해주는 동료', factor: ['F'], val: [33] }
    ]
  },
  {
    q: '💪 드디어 첫 업무를 시작한다. 가장 먼저 할 일은?',
    answer: [
      { a: '어떤 일을 언제까지 할지 계획부터 짠다', factor: ['J'], val: [33] },
      { a: '시작이 반이다! 일단 자료조사부터 한다', factor: ['P'], val: [33] }
    ]
  },
  {
    q: '🤸‍♂️ 기다리던 퇴근 시간! 마지막으로 할 일은?',
    answer: [
      { a: '자리만 슥삭 정리한다', factor: ['P'], val: [33] },
      { a: '내일 할 일을 적어둔다', factor: ['J'], val: [33] }
    ]
  },
  {
    q: '🤔 저녁을 먹으려고 했던 가게가 문을 닫았다',
    answer: [
      { a: '그럴 줄 알고 한두 군데 더 찾아뒀다', factor: ['J'], val: [33] },
      { a: '오다가 본 다른 가게에 가자고 제안한다', factor: ['P'], val: [33] }
    ]
  }
];

const TestType = () => {
  const [idx, setIdx] = useState(0);
  const [progressLen, setProgressLen] = useState(0);
  const [factor, setFactor] = useState([0, 0, 0, 0]);

  const [mainStyle, setMainStyle] = useState(null);
  const [qnaStyle, setQnaStyle] = useState(null);
  const username = useParams().username;
  const navigate = useNavigate();
  const numQuestion = 12;

  const begin = () => {
    setIdx(0);
    setProgressLen(0);
    setFactor([0, 0, 0, 0]);
    setMainStyle({ display: 'none' });
    setQnaStyle({ display: 'inline-block' });
  };

  const calculateNewFactor = (currentFactor, questionIdx, answerBtnNum) => {
    const { factor, val } = qnaList[questionIdx].answer[answerBtnNum];
    const newFactor = [...currentFactor];

    switch (factor[0]) {
      case 'N':
        newFactor[2] += val[0];
        break;
      case 'S':
        newFactor[2] -= val[0];
        break;
      case 'T':
        newFactor[1] += val[0];
        break;
      case 'F':
        newFactor[1] -= val[0];
        break;
      case 'E':
        newFactor[3] += val[0];
        break;
      case 'I':
        newFactor[3] -= val[0];
        break;
      case 'P':
        newFactor[0] += val[0];
        break;
      case 'J':
        newFactor[0] -= val[0];
        break;
      default:
        break;
    }
    return newFactor;
  };

  const saveType = async (factorToSave) => {
    const saveUrl = `${serverUrl}/user/api/dashboard/${username}/dev-type/save/`;
    await axiosInstance.post(saveUrl, { factor: factorToSave }, getAuthConfig());
  };

  const clickAnswer = async (btnNum) => {
    const newFactor = calculateNewFactor(factor, idx, btnNum);

    if (idx < 11) {
      setFactor(newFactor);
      setIdx(idx + 1);
      setProgressLen(((idx + 1) / numQuestion) * 100);
    } else {
      setQnaStyle({ display: 'none' });
      try {
        await saveType(newFactor);
      } catch (error) {
        console.error('유형 저장 실패:', error);
      } finally {
        navigate('../dev-type');
      }
    }
  };

  const bgImgStyle = {
    backgroundImage: `url('${serverUrl}/static/images/back.png')`,
  };

  return (
    <div className="container">
      <section id="main" style={mainStyle}>
        <div className="board mx-0 mt-5" style={bgImgStyle}>
          <div className="my-3">
            <h3>나와 가장 닮은 개발 언어는?</h3>
          </div>
          <div className="d-flex justify-content-center">
            <span className="endpoint left"></span>
            <span className="line-connect"></span>
            <span className="endpoint right"></span>
          </div>
          <div className="my-3">
            나의 성격과 가장 닮은 개발 언어를 찾아보세요!
            <br />
            이 테스트는 구름 IDE에서 제작한 컨텐츠입니다
          </div>
          <div className="d-flex flex-column align-items-center gap-2 my-2">
            <button className="btn btn-test-start" onClick={begin}>
              시작하기
            </button>
            <button className="btn btn-test-back" onClick={() => navigate('../dev-type')}>
              돌아가기
            </button>
          </div>
        </div>
      </section>
      <section id="qna" className="m-0" style={qnaStyle}>
        <div className="qbox my-5 py-3">{qnaList[idx].q}</div>
        <div className="abox">
          <button className="answerbtn mb-2" onClick={() => clickAnswer(0)}>
            {qnaList[idx].answer[0].a}
          </button>
          <button className="answerbtn mt-1" onClick={() => clickAnswer(1)}>
            {qnaList[idx].answer[1].a}
          </button>
        </div>
        <ProgressBar className="progress mt-5" now={progressLen}></ProgressBar>
      </section>
    </div>
  );
};

export default TestType;
