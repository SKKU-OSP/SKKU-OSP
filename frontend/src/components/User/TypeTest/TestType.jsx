import React, { useEffect, useState } from 'react';
import { Button, ProgressBar } from 'react-bootstrap';

import ResultProgress from './ResultProgress';
import { qnaList, descList, resultList } from './TypeData';
import './TestType.css';

const TestType = () => {
  const [idx, setIdx] = useState(0);
  const [progressLen, setProgressLen] = useState(0);
  const [devType, setDevType] = useState('');
  const [descKr, setDescKr] = useState('');
  const [descEng, setDescEng] = useState('');
  const [factor, setFactor] = useState([0, 0, 0, 0]);
  const [resultIdx, setResultIdx] = useState(0);
  const numQuestion = 15;

  let P, N, T, E;

  const begin = () => {
    main.style.display = 'none';
    qna.style.display = 'inline-block';
  };

  const clickAnswer = (btnNum) => {
    if (idx < 14) {
      getResult(idx, btnNum);
      setIdx(idx + 1);
      setProgressLen(((idx + 1) / numQuestion) * 100);
    } else {
      getResult(idx, btnNum);
      qna.style.display = 'none';
      result.style.display = 'inline-block';
      setResult();
    }
  };

  const getResult = (idx, btnNum) => {
    if (qnaList[idx].answer[btnNum].factor.length > 1) {
      if (qnaList[idx].answer[btnNum].factor[1] == 'N') {
        setFactor([factor[0], factor[1], factor[2] + qnaList[idx].answer[btnNum].val[1], factor[3]]);
      } else if (qnaList[idx].answer[btnNum].factor[1] == 'S') {
        setFactor([factor[0], factor[1], factor[2] - qnaList[idx].answer[btnNum].val[1], factor[3]]);
      } else if (qnaList[idx].answer[btnNum].factor[1] == 'T') {
        setFactor([factor[0], factor[1] + qnaList[idx].answer[btnNum].val[1], factor[2], factor[3]]);
      } else if (qnaList[idx].answer[btnNum].factor[1] == 'F') {
        setFactor([factor[0], factor[1] - qnaList[idx].answer[btnNum].val[1], factor[2], factor[3]]);
      } else if (qnaList[idx].answer[btnNum].factor[1] == 'E') {
        setFactor([factor[0], factor[1], factor[2], factor[3] + qnaList[idx].answer[btnNum].val[1]]);
      } else if (qnaList[idx].answer[btnNum].factor[1] == 'I') {
        setFactor([factor[0], factor[1], factor[2], factor[3] - qnaList[idx].answer[btnNum].val[1]]);
      } else if (qnaList[idx].answer[btnNum].factor[1] == 'P') {
        setFactor([factor[0] + qnaList[idx].answer[btnNum].val[1], factor[1], factor[2], factor[3]]);
      } else if (qnaList[idx].answer[btnNum].factor[1] == 'J') {
        setFactor([factor[0] - qnaList[idx].answer[btnNum].val[1], factor[1], factor[2], factor[3]]);
      }
    }

    if (qnaList[idx].answer[btnNum].factor[0] == 'N') {
      setFactor([factor[0], factor[1], factor[2] + qnaList[idx].answer[btnNum].val[0], factor[3]]);
    } else if (qnaList[idx].answer[btnNum].factor[0] == 'S') {
      setFactor([factor[0], factor[1], factor[2] - qnaList[idx].answer[btnNum].val[0], factor[3]]);
    } else if (qnaList[idx].answer[btnNum].factor[0] == 'T') {
      setFactor([factor[0], factor[1] + qnaList[idx].answer[btnNum].val[0], factor[2], factor[3]]);
    } else if (qnaList[idx].answer[btnNum].factor[0] == 'F') {
      setFactor([factor[0], factor[1] - qnaList[idx].answer[btnNum].val[0], factor[2], factor[3]]);
    } else if (qnaList[idx].answer[btnNum].factor[0] == 'E') {
      setFactor([factor[0], factor[1], factor[2], factor[3] + qnaList[idx].answer[btnNum].val[0]]);
    } else if (qnaList[idx].answer[btnNum].factor[0] == 'I') {
      setFactor([factor[0], factor[1], factor[2], factor[3] - qnaList[idx].answer[btnNum].val[0]]);
    } else if (qnaList[idx].answer[btnNum].factor[0] == 'P') {
      setFactor([factor[0] + qnaList[idx].answer[btnNum].val[0], factor[1], factor[2], factor[3]]);
    } else if (qnaList[idx].answer[btnNum].factor[0] == 'J') {
      setFactor([factor[0] - qnaList[idx].answer[btnNum].val[0], factor[1], factor[2], factor[3]]);
    }
  };

  const setResult = () => {
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
    setDevType(`http://127.0.0.1:8000/static/images/${tmp}.png`);
  };

  useEffect(() => {
    console.log(devType);
  }, [devType]);

  return (
    <div className="container">
      <section id="main">
        <div className="board mx-0 mt-5">
          <div className="my-3">
            <h3>개발자 유형 검사</h3>
          </div>
          <div className={'d-flex justify-content-center'}>
            <span className="endpoint left"></span>
            <span className="line-connect"></span>
            <span className="endpoint right"></span>
          </div>
          <div className="my-2">
            위 검사는 개발자 성향 지표를 자가 진단을 통해 분석합니다
            <br />
            과학적인 조사와 통계를 기반으로 하지 않습니다
            <br />
            결과는 추천 시스템과 무관하니 참고용으로 즐겨주시길 바랍니다
          </div>
          <div className="my-2">
            <Button id="gbti-test-start" onClick={begin}>
              시작하기
            </Button>
          </div>
        </div>
      </section>
      <section id="qna" className="m-0">
        <div className="qbox my-5 py-3">{qnaList[idx].q}</div>
        <div className="abox">
          <Button className="answerbtn mb-2" onClick={() => clickAnswer(0)}>
            {qnaList[idx].answer[0].a}
          </Button>
          <Button className="answerbtn mt-1" onClick={() => clickAnswer(1)}>
            {qnaList[idx].answer[1].a}
          </Button>
        </div>
        <ProgressBar className="progress mt-5" now={progressLen}></ProgressBar>
      </section>
      <section id="result" className="mx-auto mt-5">
        <h3>개발자 유형 검사 결과</h3>
        <div className="d-flex justify-content-center">
          <span className="endpoint left"></span>
          <span className="line-connect"></span>
          <span className="endpoint right"></span>
        </div>
        <div id="gbti-id-card" style={{ position: 'relative' }}>
          <div id="gbti-id-card-content" className="modal-gbti-card">
            <p className="weak-text ms-3 my-2 text-start">OSS ID CARD</p>
            <div className="d-flex justify-content-center">
              <div className="gbti-content d-flex justify-content-center" style={{ padding: '1% 4%', width: '50%' }}>
                <img src={devType} className="gbti-img" />
              </div>
              <div
                className="gbti-content d-flex flex-column justify-content-between"
                style={{ padding: '1% 4%', width: '50%' }}
              >
                <p
                  id="descEng"
                  className="text-center text-label"
                  style={{ fontSize: '12px', marginBottom: '2px', fontWeight: '600' }}
                >
                  {descEng}
                </p>
                <p id="descKr" className="text-center text-label mb-1" style={{ fontSize: '14px', fontWeight: '600' }}>
                  {descKr}
                </p>
                <h4 id="typeEng" className="text-center">
                  {resultList[resultIdx].typeEng}
                </h4>
                <h4 id="typeKr" className="text-center">
                  {resultList[resultIdx].typeKr}
                </h4>
                <div className="d-flex justify-content-between text-label">
                  <span>Fluid</span>
                  <span>Steady</span>
                </div>
                <ResultProgress factor={factor[0]} />
                <div className="d-flex justify-content-between text-label">
                  <span>CoolHead</span>
                  <span>WarmHeart</span>
                </div>
                <ResultProgress factor={factor[1]} />
                <div className="d-flex justify-content-between text-label">
                  <span>Creative</span>
                  <span>Efficient</span>
                </div>
                <ResultProgress factor={factor[2]} />
                <div className="d-flex justify-content-between text-label">
                  <span>MultiPlay</span>
                  <span>SinglePlay</span>
                </div>
                <ResultProgress factor={factor[3]} />
              </div>
            </div>
            <p className="weak-text me-3 my-2 text-end">2023 &#9426; SKKU-OSP</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestType;
