import './Statistic.css';
import OverviewChart from './Charts/OverviewChart';
import { makeErrorJson, getChartConfig, scoreOption, noLegendOption } from '../../utils/chartOption';

function AnnualOverviews({ overviewData, isReady, years }) {
  const errorScoreData = isReady ? makeErrorJson(overviewData.score, overviewData.score_std) : [];
  const errorCommitData = isReady ? makeErrorJson(overviewData.commit, overviewData.commit_std) : [];
  const errorStarData = isReady ? makeErrorJson(overviewData.star, overviewData.star_std) : [];
  const errorPRData = isReady ? makeErrorJson(overviewData.pr, overviewData.pr_std) : [];
  const errorIssueData = isReady ? makeErrorJson(overviewData.issue, overviewData.issue_std) : [];

  const getDatasets = (data, colors = '#0d6efd') => {
    return [
      {
        data: data,
        backgroundColor: colors
      }
    ];
  };

  return (
    <div className="row pt-2 mb-2">
      <div className="col-percent-20 col-lg-percent-50 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 Score</h5>
          {isReady && <OverviewChart options={scoreOption} data={getChartConfig(years, getDatasets(errorScoreData))} />}
        </div>
      </div>
      <div className="col-percent-20 col-lg-percent-50 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 Commit</h5>
          {isReady && (
            <OverviewChart options={noLegendOption} data={getChartConfig(years, getDatasets(errorCommitData))} />
          )}
        </div>
      </div>
      <div className="col-percent-20 col-lg-percent-33 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 Star</h5>
          {isReady && (
            <OverviewChart options={noLegendOption} data={getChartConfig(years, getDatasets(errorStarData))} />
          )}
        </div>
      </div>
      <div className="col-percent-20 col-lg-percent-33 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 PR</h5>
          {isReady && <OverviewChart options={noLegendOption} data={getChartConfig(years, getDatasets(errorPRData))} />}
        </div>
      </div>
      <div className="col-percent-20 col-lg-percent-33 col-md-percent-100">
        <div className="card p-2">
          <h5 className="card-title">연도별 Issue</h5>
          {isReady && (
            <OverviewChart options={noLegendOption} data={getChartConfig(years, getDatasets(errorIssueData))} />
          )}
        </div>
      </div>
    </div>
  );
}

export default AnnualOverviews;
