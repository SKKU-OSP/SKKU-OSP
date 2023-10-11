import { useEffect, useState } from 'react';

import axios from 'axios';
import { useParams } from 'react-router-dom';

import DevTendency from './Charts/DevTendency';
import ChartsByYear from './Charts/ChartsByYear';
import { getAuthConfig } from '../../../utils/auth';

import './DashBoard.css';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const dashboardDataUrl = `${serverDomain}/user/api/dashboard/`;

function Dashboard() {
  const { username } = useParams();
  const [devTendency, setDevTendency] = useState(null);
  const [devTendencyError, setDevTendencyError] = useState(null);

  useEffect(() => {
    const getDevTendency = async () => {
      try {
        const response = await axios.get(`${dashboardDataUrl}${username}/dev-tendency/`, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setDevTendency(res.data);
          setDevTendencyError(null);
          console.log('getDevTendency', res.data);
        } else {
          console.log(res.message);
          setDevTendencyError(res.message);
        }
      } catch (error) {
        console.log('getDevTendency error', error);
        setDevTendencyError('개발성향 데이터를 가져오는데 실패했습니다.');
      }
    };
    getDevTendency();
  }, [username]);
  return (
    <>
      {devTendencyError && <div>{devTendencyError}</div>}
      {devTendency && <DevTendency data={devTendency} />}
      <ChartsByYear />
    </>
  );
}

export default Dashboard;
