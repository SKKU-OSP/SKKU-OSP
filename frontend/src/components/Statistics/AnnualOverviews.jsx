import './Statistic.css';
import OverviewChart from './Charts/OverviewChart';
import { makeErrorJson, getChartConfig, scoreOption, noLegendOption } from '../../utils/chartOption';
import { useChartData } from '../../api/reactQuery/statistics/useChartData';

function AnnualOverviews() {
  // TODO: 에러 핸들링 추가
  const { data, isLoading, isError } = useChartData();

  // TODO: 로딩 컴포넌트 추가
  if (isLoading) {
    return <div>Loading...</div>;
  }

  const getDatasets = (data, colors = '#0d6efd') => {
    return [
      {
        data: data,
        backgroundColor: colors
      }
    ];
  };

  // 차트 컴포넌트에서 사용할 데이터 정리
  const viewData = [
    {
      title: '연도별 Score',
      options: scoreOption,
      data: makeErrorJson(data.overviewData.score, data.overviewData.score_std)
    },
    {
      title: '연도별 Commit',
      options: noLegendOption,
      data: makeErrorJson(data.overviewData.commit, data.overviewData.commit_std)
    },
    {
      title: '연도별 Star',
      options: noLegendOption,
      data: makeErrorJson(data.overviewData.star, data.overviewData.star_std)
    },
    {
      title: '연도별 PR',
      options: noLegendOption,
      data: makeErrorJson(data.overviewData.pr, data.overviewData.pr_std)
    },
    {
      title: '연도별 Issue',
      options: noLegendOption,
      data: makeErrorJson(data.overviewData.issue, data.overviewData.issue_std)
    }
  ];

  return (
    <>
      <div className="row pt-2 mb-2">
        {viewData.map((item, index) => (
          <div key={index} className="col-percent-20 col-lg-percent-50 col-md-percent-100">
            <div className="card p-2">
              <h5 className="card-title">{item.title}</h5>
              <OverviewChart options={item.options} data={getChartConfig(data.years, getDatasets(item.data))} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default AnnualOverviews;
