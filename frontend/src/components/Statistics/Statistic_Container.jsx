import { useEffect, useState } from 'react';
import AnnualDetails from './AnnualDetails';
import AnnualOverviews from './AnnualOverviews';
import AnnualSelectors from './AnnualSelectors';
import CaseSelectors from './CaseSelectors';
import FactorDists from './FactorDists';
import FactorSelectors from './FactorSelectors';

import axios from 'axios';
import { getAuthConfig } from '../../utils/auth';

const serverDomain = import.meta.env.VITE_SERVER_URL;
const chartDataUrl = `${serverDomain}/home/api/statistic/`;

function Statistic_Container() {
  const [caseNum, setCaseNum] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [years, setYears] = useState([]);
  const [targetYear, setTargetYear] = useState(2023);

  useEffect(() => {
    console.log('Statistic_Container useEffect');

    const getStatisticData = async () => {
      try {
        const response = await axios.get(chartDataUrl, getAuthConfig());
        const res = response.data;
        console.log('res', res);
        if (res.status === 'success') {
          console.log(res.status, res.message);
          console.log('res.data', res.data);
          setChartData(res.data);
        } else {
          console.log('res.status', res.status);

          console.log('res.message', res.message);
        }
      } catch (error) {
        console.log(error);
      }
    };

    getStatisticData();
  }, []);

  useEffect(() => {
    console.log('caseNum', caseNum);
    if (chartData) {
      const findOverview = chartData.annual_overview.find((obj) => obj.case_num === caseNum);
      const findDetail = chartData.annual_total.find((obj) => obj.case_num === caseNum);

      console.log('findOverview', findOverview);
      setOverviewData(findOverview);
      setDetailData(findDetail);
      setYears(chartData.years);

      setIsReady(true);
    }
  }, [chartData, caseNum]);

  const handleCaseNum = (targetCase) => {
    setCaseNum(targetCase);
  };

  return (
    <>
      <CaseSelectors onSetCaseNum={handleCaseNum} />
      <AnnualOverviews overviewData={overviewData} isReady={isReady} years={years} />
      <AnnualSelectors />
      <AnnualDetails detailData={detailData} isReady={isReady} years={years} targetYear={targetYear} />
      <FactorSelectors />
      <FactorDists />
    </>
  );
}

export default Statistic_Container;
