import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuthConfig } from '../../../utils/auth';

import DevType from './DevType';
import DevTendency from './DevTendency';
import './DevAnalysis.css';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const dashboardDataUrl = `${serverDomain}/user/api/dashboard/`;

function DevAnalysis() {
  const { username } = useParams();
  const [devType, setDevType] = useState(null);
  const [devTendency, setDevTendency] = useState(null);
  const [devTendencyData, setDevTendencyData] = useState(null);
  const [coworkers, setCoworkers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getDevTendency = async () => {
      try {
        const response = await axios.get(`${dashboardDataUrl}${username}/dev-tendency/`, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setDevTendency(res.data.dev_tendency);
          setDevTendencyData(res.data.dev_tendency_data);
          setCoworkers(res.data.coworkers);
        } else {
          console.log(res.message);
          setError(res.message);
        }
      } catch (error) {
        console.log('getDevTendency error', error);
        setError('개발성향 데이터를 가져오는데 실패했습니다.');
      }
    };
    const getDevType = async () => {
      try {
        const response = await axios.get(`${dashboardDataUrl}${username}/dev-type/`, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setDevType(res.data.dev_type);
        } else {
          console.log(res.message);
          setError(res.message);
        }
      } catch (error) {
        console.log('getDevType error', error);
        setError('개발유형 데이터를 가져오는데 실패했습니다.');
      }
    };
    getDevTendency();
    getDevType();
  }, [username]);

  return (
    <div className="container my-4">
      {error && <div>{error}</div>}
      <div>{devTendency && <DevTendency data={devTendency} chartData={devTendencyData} coworkers={coworkers} />}</div>
      <div>{devType && <DevType data={devType} />}</div>
    </div>
  );
}

export default DevAnalysis;
