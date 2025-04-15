import { useEffect, useState } from 'react';
import AnnualOverviews from './AnnualOverviews';
import CaseSelectors from './CaseSelectors';
import StatisticMain from './StatisticMain';

import axios from 'axios';
import axiosInstance from '../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../utils/auth';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const chartDataUrl = `${serverDomain}/home/api/statistic/`;

function Statistic_Container() {
  const [caseNum, setCaseNum] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [distData, setDistData] = useState(null);
  const [factorsClassNum, setFactorsClassNum] = useState([]);
  const [factorLevelStep, setFactorLevelStep] = useState([]);
  const [userData, setUserData] = useState([]);
  const [years, setYears] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getStatisticData = async () => {
      try {
        const response = await axiosInstance.get(chartDataUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          console.log(res.status, res.data);
          setChartData(res.data);
        } else {
          console.log(res.status, res.message);
          setError(res.message);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    getStatisticData();
  }, []);

  useEffect(() => {
    if (chartData) {
      setYears(chartData.years);
      setUserData(chartData.student_data);
      const findOverview = chartData.annual_overview.find((obj) => obj.case_num === caseNum);
      const findDetail = chartData.annual_total.find((obj) => obj.case_num === caseNum);
      const findDist = chartData.annual_data.factor.find((obj) => obj.case_num === caseNum);
      findDist.depts = chartData.depts;
      findDist.sids = chartData.sids;
      findDist.factors = chartData.factors;
      setOverviewData(findOverview);
      setFactorsClassNum(findOverview.class_num);
      setFactorLevelStep(findOverview.level_step);
      setDetailData(findDetail);
      setDistData(findDist);
      setIsReady(true);
    }
  }, [chartData, caseNum]);

  const handleCaseNum = (targetCase) => {
    setCaseNum(targetCase);
  };

  return (
    <>
      {error && <div>{error}</div>}
      {!error && (
        <>
          <CaseSelectors onSetCaseNum={handleCaseNum} />
          <AnnualOverviews overviewData={overviewData} isReady={isReady} years={years} />
          <StatisticMain
            detailData={detailData}
            distData={distData}
            userData={userData}
            factorsClassNum={factorsClassNum}
            factorLevelStep={factorLevelStep}
            isReady={isReady}
            years={years}
          />
        </>
      )}
    </>
  );
}

export default Statistic_Container;
