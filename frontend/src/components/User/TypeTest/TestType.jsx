import { useEffect, useState } from 'react';
import { ProgressBar } from 'react-bootstrap';

import DevTypeCard from './DevTypeCard';
import { qnaList, descList, resultList } from './TypeData';
import './TestType.css';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../utils/auth';

const serverUrl = import.meta.env.VITE_SERVER_URL;
const TestType = () => {
  const [idx, setIdx] = useState(0);
  const [progressLen, setProgressLen] = useState(0);
  const [devType, setDevType] = useState('');
  const [descKr, setDescKr] = useState('');
  const [descEng, setDescEng] = useState('');
  const [factor, setFactor] = useState([0, 0, 0, 0]);
  const [resultIdx, setResultIdx] = useState(0);

  const [mainStyle, setMainStyle] = useState(null);
  const [qnaStyle, setQnaStyle] = useState(null);
  const [resultStyle, setResultStyle] = useState(null);
  const username = useParams().username;
  const navigate = useNavigate();
  const numQuestion = 12;

  let P, N, T, E;

  const begin = () => {
    // main.style.display = 'none';
    // qna.style.display = 'inline-block';
    setIdx(0);
    setProgressLen(0);
    setFactor([0, 0, 0, 0]);
    setResultIdx(0);

    setMainStyle({ display: 'none' });
    setQnaStyle({ display: 'inline-block' });
    setResultStyle({ display: 'none' });
  };

  const clickAnswer = (btnNum) => {
    if (idx < 11) {
      getResult(idx, btnNum);
      setIdx(idx + 1);
      setProgressLen(((idx + 1) / numQuestion) * 100);
    } else {
      getResult(idx, btnNum);
      //   qna.style.display = 'none';
      //   result.style.display = 'inline-block';
      setQnaStyle({ display: 'none' });
      setResultStyle({ display: 'inline-block' });
      setResult();
    }
  };

  // const getResult = (idx, btnNum) => {
  //   if (qnaList[idx].answer[btnNum].factor.length > 1) {
  //     if (qnaList[idx].answer[btnNum].factor[1] == 'N') {
  //       setFactor([factor[0], factor[1], factor[2] + qnaList[idx].answer[btnNum].val[1], factor[3]]);
  //     } else if (qnaList[idx].answer[btnNum].factor[1] == 'S') {
  //       setFactor([factor[0], factor[1], factor[2] - qnaList[idx].answer[btnNum].val[1], factor[3]]);
  //     } else if (qnaList[idx].answer[btnNum].factor[1] == 'T') {
  //       setFactor([factor[0], factor[1] + qnaList[idx].answer[btnNum].val[1], factor[2], factor[3]]);
  //     } else if (qnaList[idx].answer[btnNum].factor[1] == 'F') {
  //       setFactor([factor[0], factor[1] - qnaList[idx].answer[btnNum].val[1], factor[2], factor[3]]);
  //     } else if (qnaList[idx].answer[btnNum].factor[1] == 'E') {
  //       setFactor([factor[0], factor[1], factor[2], factor[3] + qnaList[idx].answer[btnNum].val[1]]);
  //     } else if (qnaList[idx].answer[btnNum].factor[1] == 'I') {
  //       setFactor([factor[0], factor[1], factor[2], factor[3] - qnaList[idx].answer[btnNum].val[1]]);
  //     } else if (qnaList[idx].answer[btnNum].factor[1] == 'P') {
  //       setFactor([factor[0] + qnaList[idx].answer[btnNum].val[1], factor[1], factor[2], factor[3]]);
  //     } else if (qnaList[idx].answer[btnNum].factor[1] == 'J') {
  //       setFactor([factor[0] - qnaList[idx].answer[btnNum].val[1], factor[1], factor[2], factor[3]]);
  //     }
  //   }

  //   if (qnaList[idx].answer[btnNum].factor[0] == 'N') {
  //     setFactor([factor[0], factor[1], factor[2] + qnaList[idx].answer[btnNum].val[0], factor[3]]);
  //   } else if (qnaList[idx].answer[btnNum].factor[0] == 'S') {
  //     setFactor([factor[0], factor[1], factor[2] - qnaList[idx].answer[btnNum].val[0], factor[3]]);
  //   } else if (qnaList[idx].answer[btnNum].factor[0] == 'T') {
  //     setFactor([factor[0], factor[1] + qnaList[idx].answer[btnNum].val[0], factor[2], factor[3]]);
  //   } else if (qnaList[idx].answer[btnNum].factor[0] == 'F') {
  //     setFactor([factor[0], factor[1] - qnaList[idx].answer[btnNum].val[0], factor[2], factor[3]]);
  //   } else if (qnaList[idx].answer[btnNum].factor[0] == 'E') {
  //     setFactor([factor[0], factor[1], factor[2], factor[3] + qnaList[idx].answer[btnNum].val[0]]);
  //   } else if (qnaList[idx].answer[btnNum].factor[0] == 'I') {
  //     setFactor([factor[0], factor[1], factor[2], factor[3] - qnaList[idx].answer[btnNum].val[0]]);
  //   } else if (qnaList[idx].answer[btnNum].factor[0] == 'P') {
  //     setFactor([factor[0] + qnaList[idx].answer[btnNum].val[0], factor[1], factor[2], factor[3]]);
  //   } else if (qnaList[idx].answer[btnNum].factor[0] == 'J') {
  //     setFactor([factor[0] - qnaList[idx].answer[btnNum].val[0], factor[1], factor[2], factor[3]]);
  //   }
  // };

  // factor 1개로 통일 (질문지 변경)
  const getResult = (idx, btnNum) => {
    const { factor, val } = qnaList[idx].answer[btnNum];

    switch (factor[0]) {
      case 'N':
        setFactor(prev => [prev[0], prev[1], prev[2] + val[0], prev[3]]);
        break;
      case 'S':
        setFactor(prev => [prev[0], prev[1], prev[2] - val[0], prev[3]]);
        break;
      case 'T':
        setFactor(prev => [prev[0], prev[1] + val[0], prev[2], prev[3]]);
        break;
      case 'F':
        setFactor(prev => [prev[0], prev[1] - val[0], prev[2], prev[3]]);
        break;
      case 'E':
        setFactor(prev => [prev[0], prev[1], prev[2], prev[3] + val[0]]);
        break;
      case 'I':
        setFactor(prev => [prev[0], prev[1], prev[2], prev[3] - val[0]]);
        break;
      case 'P':
        setFactor(prev => [prev[0] + val[0], prev[1], prev[2], prev[3]]);
        break;
      case 'J':
        setFactor(prev => [prev[0] - val[0], prev[1], prev[2], prev[3]]);
        break;
    }
  };

  const saveType = async () => {
    const saveUrl = `${serverUrl}/user/api/dashboard/${username}/dev-type/save/`;
    const response = await axiosInstance.post(saveUrl, { factor }, getAuthConfig());
    const res = response.data;
    if (res.status === 'success') {
      console.log(res.message);
    }
  };
  const setResult = () => {
    saveType();
    P = factor[0] > 0 ? 0 : 1;
    T = factor[1] > 0 ? 0 : 1;
    N = factor[2] > 0 ? 0 : 1;
    E = factor[3] > 0 ? 0 : 1;

    let tmp = descList[0][P].descKr + descList[1][T].descKr + descList[2][N].descKr + descList[3][E].descKr; //한글 설명 생성
    setDescKr(tmp);
    tmp = descList[0][P].descEng + descList[1][T].descEng + descList[2][N].descEng + descList[3][E].descEng; //영문 설명 생성
    setDescEng(tmp);

    tmp = (E ? 'I' : 'E') + (N ? 'S' : 'N') + (T ? 'F' : 'T') + (P ? 'J' : 'P');
    for (let k = 0; k < 16; k++) {
      if (tmp == resultList[k].mbti) setResultIdx(k);
    }
    setDevType(`${serverUrl}/static/images/${tmp}.png`);
  };

  useEffect(() => {
    console.log(devType);
  }, [devType]);

  const bgImgStyle = {
    backgroundImage: `url('${serverUrl}/static/images/back.png')`
  };

  return (
    <div className="container">
      <section id="main" style={mainStyle}>
        <div className="board mx-0 mt-5" style={bgImgStyle}>
          <div className="my-3">
            <h3>개발자 유형 검사</h3>
          </div>
          <div className="d-flex justify-content-center">
            <span className="endpoint left"></span>
            <span className="line-connect"></span>
            <span className="endpoint right"></span>
          </div>
          <div className="my-3">
            위 검사는 개발자 성향 지표를 자가 진단을 통해 분석합니다
            <br />
            과학적인 조사와 통계를 기반으로 하지 않습니다
            <br />
            결과는 추천 시스템과 무관하니 참고용으로 즐겨주시길 바랍니다
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
      <section id="result" className="mx-auto mt-5" style={resultStyle}>
        <h3>개발자 유형 검사 결과</h3>
        <div className="d-flex justify-content-center">
          <span className="endpoint left"></span>
          <span className="line-connect"></span>
          <span className="endpoint right"></span>
        </div>
        <DevTypeCard
          devType={devType}
          descEng={descEng}
          descKr={descKr}
          typeEng={resultList[resultIdx].typeEng}
          typeKr={resultList[resultIdx].typeKr}
          factors={factor}
        />
        <div className="d-flex justify-content-between gap-3 my-3">
          <button className="btn btn-test-start" onClick={begin}>
            다시하기
          </button>
          <button className="btn btn-test-back" onClick={() => navigate('../dev-type')}>
            완료
          </button>
        </div>
      </section>
    </div>
  );
};

export default TestType;
