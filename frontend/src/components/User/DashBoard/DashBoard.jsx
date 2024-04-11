import { useEffect, useState } from 'react';

import axios from 'axios';
import { useParams } from 'react-router-dom';

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
        const response = await axios.get(contrUrl, getAuthConfig());
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
        const response = await axios.get(`${dashboardDataUrl}${username}/dev-tendency/`, getAuthConfig());
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
      {(contr || contrError) ? ((contr && contr.commits === null ? (<div>깃허브에서 활동 정보를 수집중입니다. 잠시 후, 다시 방문해주세요. (최대 12시간 소요)</div>) : (<><div className="fs-4 mb-2 bold">전체 기여 내역</div>
        {contrError && <div>{contrError}</div>}
        {contr && (
          <div className="row d-flex dashboard-box justify-content-between mb-4">
            {Object.entries(contr).map(([label, value]) => (
              <SimpleBox key={label} label={factorKorMap[label]} value={value} />
            ))}
          </div>
        )}
        <div className="fs-4 mb-2 bold">기여 성향 분석</div>
        {(devTendency || devTendencyError) ? (<>
          {devTendencyError && <div>{devTendencyError}</div>}
          {devTendency && <DevTendency data={devTendency} />}</>) : (<LoaderIcon style={{ marginTop: '20px' }} />)}
        <ChartsByYear2 /></>))) : ((<LoaderIcon style={{ marginTop: '20px' }} />))}
    </>
  );
}

export default Dashboard;
