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

  useEffect(() => {
    const getDevTendency = async () => {
      const response = await axios.get(`${dashboardDataUrl}${username}/dev-tendency/`, getAuthConfig());
      const res = response.data;
      console.log('dev_tendency', res.data.dev_tendency);
      console.log('dev_tendency_data', res.data.dev_tendency_data);
      if (res.status === 'success') {
        setDevTendency(res.data.dev_tendency);
        setDevTendencyData(res.data.dev_tendency_data);
      } else {
        console.log(res);
      }
    };
    const getDevType = async () => {
      const response = await axios.get(`${dashboardDataUrl}${username}/dev-type/`, getAuthConfig());
      const res = response.data;
      console.log('dev_type', res.data.dev_type);
      if (res.status === 'success') {
        setDevType(res.data.dev_type);
      } else {
        console.log(res);
      }
    };
    getDevTendency();
    getDevType();
  }, [username]);

  return (
    <div className="container my-4">
      <div>{devTendency && <DevTendency data={devTendency} chartData={devTendencyData} />}</div>
      <div>{devType && <DevType data={devType} />}</div>
    </div>
  );
}

export default DevAnalysis;
