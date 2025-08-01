import { useEffect, useState } from 'react';

import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';
import { useNavigate, useParams } from 'react-router-dom';

import DevType from './DevType';
import { getAuthConfig } from '../../../utils/auth';

import './DevAnalysis.css';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const dashboardDataUrl = `${serverDomain}/user/api/dashboard/`;

function DevAnalysis() {
  const { username } = useParams();
  const [devType, setDevType] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const getDevType = async () => {
      try {
        const response = await axiosInstance.get(`${dashboardDataUrl}${username}/dev-type/`, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          res.data.dev_type ? setDevType(res.data.dev_type) : setDevType(undefined);
          setError(null);
        } else {
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
      {devType === undefined && (
        <div className="d-flex fs-4 bold mb-2 justify-content-between">
          <div style={{ fontFamily: 'nanumfont_ExtraBold' }}>나와 닮은 개발 언어는?</div>
          <div>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('test')}
              style={{ fontFamily: 'nanumfont_Bold' }}
            >
              검사하기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default DevAnalysis;
