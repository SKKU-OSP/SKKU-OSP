import Chart from './Charts/Chart';

function DevTendency(props) {
  const data = props.data;
  const chartData = props.chartData;

  const commitOption = (titleText) => {
    return {
      scales: {
        x: {
          title: {
            display: true,
            text: titleText
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Commits'
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    };
  };

  // 시계열 차트
  const timeSector = chartData.typeE_sector;
  const timeSeriesLabels = Array.from({ length: 24 }, (_, idx) => idx);
  const timeSeriesPalette = Array(24).fill('#808CE5');
  timeSeriesPalette.fill('#9AFFE7', timeSector[0], timeSector[1] + 1);

  const timeSeriesData = {
    labels: timeSeriesLabels,
    datasets: [
      {
        data: chartData.typeE_data,
        backgroundColor: timeSeriesPalette,
        borderRadius: 5
      }
    ]
  };

  const timeSeriesChartConfig = { type: 'bar', data: timeSeriesData, options: commitOption('Time of Day') };

  // 프로젝트 주기 분석 차트
  const freqLabels = ['초반', '중반', '후반', '마무리'];
  const freqPalette = ['#ff68c3', '#7ec1d6', '#808ce5', '#9f5fd4'];
  const freqData = {
    labels: freqLabels,
    datasets: [
      {
        data: chartData.typeF_data,
        backgroundColor: freqPalette,
        barPercentage: 0.8,
        borderRadius: 5
      }
    ]
  };
  const freqChartConfig = { type: 'bar', data: freqData, options: commitOption('프로젝트 기간') };

  // 협업 리포지토리 커밋
  const cooperateLabels = ['개인', '팀'];
  const cooperatePalette = ['#9ad5ff', '#0094ff'];
  const cooperateData = {
    labels: cooperateLabels,
    datasets: [
      {
        data: chartData.typeG_data,
        backgroundColor: cooperatePalette,
        barPercentage: 0.4,
        borderRadius: 5
      }
    ]
  };
  const cooperateChartConfig = { type: 'bar', data: cooperateData, options: commitOption('리포지토리') };

  return (
    <div>
      <div>
        <Chart {...timeSeriesChartConfig} />
      </div>
      <div>
        <Chart {...freqChartConfig} />
      </div>
      <div>
        <Chart {...cooperateChartConfig} />
      </div>
    </div>
  );
}

export default DevTendency;
