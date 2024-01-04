import { useEffect, useState } from 'react';

import axios from 'axios';
import { useParams } from 'react-router-dom';

import DevType from './DevType';
import { getAuthConfig } from '../../../utils/auth';

import './DevAnalysis.css';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const dashboardDataUrl = `${serverDomain}/user/api/dashboard/`;

function DevAnalysis() {
  const { username } = useParams();
  const [devType, setDevType] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getDevType = async () => {
      try {
        const response = await axios.get(`${dashboardDataUrl}${username}/dev-type/`, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setDevType(res.data.dev_type);
          setError(null);
        } else {
          console.log(res.message);
          setError(res.message);
        }
      } catch (error) {
        console.log('getDevType error', error);
        setError('개발유형 데이터를 가져오는데 실패했습니다.');
      }
    };
    getDevType();
  }, [username]);

  return (
    <>
      {error && <div>{error}</div>}
      {devType && <DevType data={devType} />}
    </>
  );
}

export default DevAnalysis;
