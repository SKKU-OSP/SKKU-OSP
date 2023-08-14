import './Statistic.css';
import OverviewChart from './Charts/OverviewChart';

function makeErrorJson(dataArr, stdArr) {
  let errorJsonData = dataArr.map((val, idx) => {
    const y = Number(val);
    const yMax = Number((y + Number(stdArr[idx])).toFixed(2));
    const yMin = Number(Math.max(0, y - Number(stdArr[idx])).toFixed(2));
    return {
      y,
      yMax,
      yMin
    };
  });

  return errorJsonData;
}

function AnnualOverviews({ overviewData, isReady, years }) {
  const scoreOption = {
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { max: 5, beginAtZero: true }
    }
  };
  const noLegendOption = {
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  const errorScoreData = isReady ? makeErrorJson(overviewData.score, overviewData.score_std) : [];
  const errorCommitData = isReady ? makeErrorJson(overviewData.commit, overviewData.commit_std) : [];
  const errorStarData = isReady ? makeErrorJson(overviewData.star, overviewData.star_std) : [];
  const errorPRData = isReady ? makeErrorJson(overviewData.pr, overviewData.pr_std) : [];
  const errorIssueData = isReady ? makeErrorJson(overviewData.issue, overviewData.issue_std) : [];

  const getOverviewData = (errorData) => {
    return {
      labels: years,
      datasets: [
        {
          data: errorData,
          backgroundColor: '#0d6efd'
        }
      ]
    };
  };

  return (
    <div className="row pt-2 mb-2">
      <div className="col-percent-20 col-lg-percent-50 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 Score</h5>
          {isReady && <OverviewChart options={scoreOption} data={getOverviewData(errorScoreData)} />}
        </div>
      </div>
      <div className="col-percent-20 col-lg-percent-50 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 Commit</h5>
          {isReady && <OverviewChart options={noLegendOption} data={getOverviewData(errorCommitData)} />}
        </div>
      </div>
      <div className="col-percent-20 col-lg-percent-33 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 Star</h5>
          {isReady && <OverviewChart options={noLegendOption} data={getOverviewData(errorStarData)} />}
        </div>
      </div>
      <div className="col-percent-20 col-lg-percent-33 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 PR</h5>
          {isReady && <OverviewChart options={noLegendOption} data={getOverviewData(errorPRData)} />}
        </div>
      </div>
      <div className="col-percent-20 col-lg-percent-33 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 Issue</h5>
          {isReady && <OverviewChart options={noLegendOption} data={getOverviewData(errorIssueData)} />}
        </div>
      </div>
    </div>
  );
}

export default AnnualOverviews;
