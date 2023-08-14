import { useEffect, useState } from 'react';
import DetailChart from './Charts/DetailChart';

function AnnualDetails({ detailData, isReady, years, targetYear }) {
  const [totalNum, setTotalNum] = useState([]);
  const [kpiData, setKpiData] = useState({ target: 0, total: 1, percent: 0 });
  const [commitData, setCommitData] = useState({ target: 0, total: 1, percent: 0 });
  const [starData, setStarData] = useState({ target: 0, total: 1, percent: 0 });
  const [repoData, setRepoData] = useState({ target: 0, total: 1, percent: 0 });

  const noLegendOption = {
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const getDetailData = (data) => {
    return {
      labels: years,
      datasets: [
        {
          data: data,
          backgroundColor: '#0d6efd'
        }
      ]
    };
  };
  const repoLineData = isReady ? detailData.repo.slice(0, years.length).reverse() : [];

  const yid = years.indexOf(targetYear);
  console.log('yid', yid);
  const getPercentageData = (data) => {
    let total = data.reduce((acc, currentValue) => acc + currentValue, 0);
    let target = data[yid];
    const percent = ((target * 100) / total).toFixed(1);
    total = numberWithCommas(total);
    target = numberWithCommas(target);

    return {
      total,
      target,
      percent
    };
  };
  const numberWithCommas = (x) => {
    if (typeof x === 'number') return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    else return x;
  };
  useEffect(() => {
    if (detailData && Object.hasOwn(detailData, 'student_total')) setTotalNum(detailData.student_total);
    if (detailData && Object.hasOwn(detailData, 'student_KP')) setKpiData(getPercentageData(detailData.student_KP));
    if (detailData && Object.hasOwn(detailData, 'commit')) setCommitData(getPercentageData(detailData.commit));
    if (detailData && Object.hasOwn(detailData, 'star')) setStarData(getPercentageData(detailData.star));
    if (repoLineData) setRepoData(getPercentageData(repoLineData));
  }, [isReady, detailData]);

  // repo data는 최신연도부터 역순으로 데이터를 받아오기 때문에 reverse과정을 포함한다.

  return (
    <div className="row pt-2">
      <div className="col-md-3">
        <div className="card p-3">
          <h5 className="card-title">3점 이상 인원</h5>
          <div className="text-center kpi">
            <span className="current text-primary" id="overGoalNumerator">
              {kpiData.target}
            </span>{' '}
            /{' '}
            <span className="total" id="overGoalDenominator">
              {kpiData.total}
            </span>
            <span className="percent-wrapper">
              (
              <span className="percent" id="overGoalPercent">
                {kpiData.percent}%
              </span>
              )
            </span>
          </div>
          {isReady && <DetailChart options={noLegendOption} data={getDetailData(detailData.student_KP)} />}
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3">
          <h5 className="card-title" id="commitTitle">
            총 Commit 수
          </h5>
          <div className="text-center kpi">
            <span className="current text-primary" id="commitNumerator">
              {commitData.target}
            </span>{' '}
            /{' '}
            <span className="total" id="commitDenominator">
              {commitData.total}
            </span>
            <span className="percent-wrapper">
              (
              <span className="percent" id="commitPercent">
                {commitData.percent}%
              </span>
              )
            </span>
          </div>
          {isReady && <DetailChart options={noLegendOption} data={getDetailData(detailData.commit)} />}
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3">
          <h5 className="card-title" id="starTitle">
            총 Star 수
          </h5>
          <div className="text-center kpi">
            <span className="current text-primary" id="starNumerator">
              {starData.target}
            </span>{' '}
            /{' '}
            <span className="total" id="starDenominator">
              {starData.total}
            </span>
            <span className="percent-wrapper">
              (
              <span className="percent" id="starPercent">
                {starData.percent}%
              </span>
              )
            </span>
          </div>
          {isReady && <DetailChart options={noLegendOption} data={getDetailData(detailData.star)} />}
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-3">
          <h5 className="card-title" id="repoTitle">
            총 Repo 수
          </h5>
          <div className="text-center kpi">
            <span className="current text-primary" id="repoNumerator">
              {repoData.target}
            </span>{' '}
            /{' '}
            <span className="total" id="repoDenominator">
              {repoData.total}
            </span>
            <span className="percent-wrapper">
              (
              <span className="percent" id="repoPercent">
                {repoData.percent}%
              </span>
              )
            </span>
          </div>
          {isReady && <DetailChart options={noLegendOption} data={getDetailData(repoLineData)} />}
        </div>
      </div>
    </div>
  );
}

export default AnnualDetails;
