import { BsGithub } from 'react-icons/bs';

import { useEffect, useState } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';
import { useParams } from 'react-router-dom';
import ReactGA from 'react-ga4';

import DevTendency from './Charts/DevTendency';
import ChartsByYear from './Charts/ChartsByYear';
import ChartsByYear2 from './Charts/ChartsByYear2';

import { getAuthConfig } from '../../../utils/auth';
import SimpleBox from './Item/SimpleBox';
import LoaderIcon from 'react-loader-icon';

import './DashBoard.css';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const dashboardDataUrl = `${serverDomain}/user/api/dashboard/`;

function Dashboard() {
  const { username } = useParams();
  const [contr, setContr] = useState(null);
  const [contrError, setContrError] = useState(null);
  const [devTendency, setDevTendency] = useState(null);
  const [devTendencyError, setDevTendencyError] = useState(null);

  useEffect(() => {
    const getContr = async () => {
      try {
        const contrUrl = `${dashboardDataUrl}${username}/contr/`;
        const response = await axiosInstance.get(contrUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setContr(res.data);
        } else {
          setContrError(res.message);
        }
      } catch (error) {
        setContrError('기여내역 데이터를 가져오는데 실패했습니다.');
      }
    };
    const getDevTendency = async () => {
      try {
        const response = await axiosInstance.get(`${dashboardDataUrl}${username}/dev-tendency/`, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setDevTendency(res.data);
          setDevTendencyError(null);
        } else {
          setDevTendencyError(res.message);
        }
      } catch (error) {
        setDevTendencyError('개발성향 데이터를 가져오는데 실패했습니다.');
      }
    };
    getContr();
    getDevTendency();
    ReactGA.event({
      category: 'Page',
      action: 'Access_Dashboard',
      label: '대시보드 접근'
    });
  }, [username]);

  const factorKorMap = {
    repo_num: '기여 리포지토리',
    commits: '커밋',
    commit_lines: '커밋 라인',
    issues: '이슈',
    prs: '풀 리퀘스트'
  };
  return (
    <>
      {contr || contrError ? (
        contr && contr.commits === null ? (
          <div>깃허브에서 활동 정보를 수집중입니다. 잠시 후, 다시 방문해주세요. (최대 12시간 소요)</div>
        ) : (
          <>
            

            

            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fs-4 bold" style={{ fontFamily: 'nanumfont_ExtraBold' }}>
                GitHub 계정 선택
              </div>
              <button className="btn-write">GitHub 계정 추가하기</button>
            </div>
            <div className="d-flex flex-column dashboard-box mb-5">
              <div className="form-check d-flex align-items-center mb-2">
                <input className="form-check-input" type="radio" name="github-account" id="github_id_1" value="github_id_1" defaultChecked />
                <label className="form-check-label d-flex align-items-center ms-2" htmlFor="github_id_1">
                  <BsGithub />
                  <a href="https://github.com/github_id_1" target="_blank" rel="noopener noreferrer" className="github_username ms-2">
                    github_id_1
                  </a>
                </label>
              </div>
              <div className="form-check d-flex align-items-center mb-2">
                <input className="form-check-input" type="radio" name="github-account" id="github_id_2" value="github_id_2" />
                <label className="form-check-label d-flex align-items-center ms-2" htmlFor="github_id_2">
                  <BsGithub />
                  <a href="https://github.com/github_id_2" target="_blank" rel="noopener noreferrer" className="github_username ms-2">
                    github_id_2
                  </a>
                </label>
              </div>
              <div className="form-check d-flex align-items-center">
                <input className="form-check-input" type="radio" name="github-account" id="github_id_3" value="github_id_3" />
                <label className="form-check-label d-flex align-items-center ms-2" htmlFor="github_id_3">
                  <BsGithub />
                  <a href="https://github.com/github_id_3" target="_blank" rel="noopener noreferrer" className="github_username ms-2">
                    github_id_3
                  </a>
                </label>
              </div>
            </div>

            <div className="fs-4 mb-2 bold" style={{ fontFamily: 'nanumfont_ExtraBold' }}>
              전체 기여 내역
            </div>
            {contrError && <div>{contrError}</div>}
            {contr && (
              <div className="row d-flex dashboard-box justify-content-between mb-4">
                {Object.entries(contr).map(([label, value]) => (
                  <SimpleBox key={label} label={factorKorMap[label]} value={value} />
                ))}
              </div>
            )}
            <div className="fs-4 mb-2 bold" style={{ fontFamily: 'nanumfont_ExtraBold' }}>
              기여 성향 분석
            </div>
            {devTendency || devTendencyError ? (
              <>
                {devTendencyError && <div>{devTendencyError}</div>}
                {devTendency && <DevTendency data={devTendency} />}
              </>
            ) : (
              <LoaderIcon style={{ marginTop: '20px' }} />
            )}
            <ChartsByYear2 />
          </>
        )
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}

export default Dashboard;
