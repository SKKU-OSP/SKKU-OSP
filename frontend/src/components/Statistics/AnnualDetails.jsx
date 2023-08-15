import { useEffect, useMemo, useState } from 'react';
import DetailChart from './Charts/DetailChart';
import DetailCardContent from './DetailCardContent';
import AnnualSelectors from './AnnualSelectors';

function AnnualDetails({ detailData, isReady, years, targetYear, onSetYear }) {
  const [kpiData, setKpiData] = useState({ target: 0, total: 1, percent: 0 });
  const [commitData, setCommitData] = useState({ target: 0, total: 1, percent: 0 });
  const [starData, setStarData] = useState({ target: 0, total: 1, percent: 0 });
  const [repoData, setRepoData] = useState({ target: 0, total: 1, percent: 0 });
  const [isTotal, setIsTotal] = useState(true);

  // repo data는 최신연도부터 역순으로 데이터를 받아오기 때문에 reverse과정을 포함한다.
  const repoLineData = useMemo(() => {
    if (isReady && Object.hasOwn(detailData, 'repo')) return detailData.repo.slice(0, years.length).reverse();
    return [];
  }, [isReady, years, detailData]);

  useEffect(() => {
    const yid = years.indexOf(targetYear);

    const getPercentageData = (data, totalNum = 0) => {
      let total = totalNum ? totalNum : data.reduce((acc, currentValue) => acc + currentValue, 0);
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

    if (detailData && Object.hasOwn(detailData, 'student_KP'))
      setKpiData(getPercentageData(detailData.student_KP, detailData.student_total[yid]));
    if (detailData && Object.hasOwn(detailData, 'commit')) setCommitData(getPercentageData(detailData.commit));
    if (detailData && Object.hasOwn(detailData, 'star')) setStarData(getPercentageData(detailData.star));
    if (repoLineData) setRepoData(getPercentageData(repoLineData));
  }, [isReady, detailData, targetYear, years, repoLineData]);

  const numberWithCommas = (x) => {
    if (typeof x === 'number') return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    else return x;
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

  const noLegendOption = {
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <>
      <AnnualSelectors
        years={years}
        targetYear={targetYear}
        onSetYear={onSetYear}
        isTotal={isTotal}
        onSetIsTotal={setIsTotal}
      />
      <div className="row pt-2">
        {isTotal && (
          <>
            <div className="col-md-3">
              <div className="card p-3">
                <DetailCardContent data={kpiData} cardTitle="3점 이상 인원" />
                {isReady && <DetailChart options={noLegendOption} data={getDetailData(detailData.student_KP)} />}
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3">
                <DetailCardContent data={commitData} cardTitle="총 Commit 수" />
                {isReady && <DetailChart options={noLegendOption} data={getDetailData(detailData.commit)} />}
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3">
                <DetailCardContent data={starData} cardTitle="총 Star 수" />
                {isReady && <DetailChart options={noLegendOption} data={getDetailData(detailData.star)} />}
              </div>
            </div>
            <div className="col-md-3">
              <div className="card p-3">
                <DetailCardContent data={repoData} cardTitle="총 Repo 수" />
                {isReady && <DetailChart options={noLegendOption} data={getDetailData(repoLineData)} />}
              </div>
            </div>
          </>
        )}
        {!isTotal && <>개별 차트</>}
      </div>
    </>
  );
}

export default AnnualDetails;
