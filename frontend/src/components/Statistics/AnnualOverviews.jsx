import './Statistic.css';
import OverviewChart from './Charts/OverviewChart';
import { makeErrorJson, getChartConfig, scoreOption, noLegendOption } from '../../utils/chartOption';
import { useChartData } from '../../api/reactQuery/statistics/useChartData';
import { useChartDataStore } from '../../stores/statistics/chartDataStore';

function AnnualOverviews({ overviewData, years }) {
  const { isLoading, isError } = useChartData();
  const { overviewData } = useChartDataStore((state) => state.getOverviewData());

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

  const overviewData = [
    { title: '연두별 Score', options: scoreOption, data: errorScoreData },
    { title: '연도별 Commit', options: noLegendOption, data: errorCommitData },
    { title: '연도별 Star', options: noLegendOption, data: errorStarData },
    { title: '연도별 PR', options: noLegendOption, data: errorPRData },
    { title: '연도별 Issue', options: noLegendOption, data: errorIssueData }
  ];

  return (
    <>
      {overviewData.map((data, index) => (
        <div className="col-percent-20 col-lg-percent-50 col-md-percent-100">
          <div className="card p-2">
            <h5 className="card-title">{data.title}</h5>
            {isReady && <OverviewChart options={data.options} data={getChartConfig(years, getDatasets(data.data))} />}
          </div>
        </div>
      ))}
    </>
  );
}

export default AnnualOverviews;
