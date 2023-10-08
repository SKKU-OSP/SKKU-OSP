import Chart from './Charts/Chart';

function DevTendency(props) {
  const data = props.data;
  const chartData = props.chartData;

  const timeSector = chartData.typeE_sector;

  const timeSeriesLabels = Array.from({ length: 24 }, (_, idx) => idx);
  const timeSeriesPalette = Array(24).fill('#808CE5');
  timeSeriesPalette.fill('#9AFFE7', timeSector[0], timeSector[1] + 1);
  console.log('timeSeriesPalette', timeSeriesPalette);

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
  const timeSeriesOption = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time of Day'
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
  const timeSeriesChartConfig = { type: 'bar', data: timeSeriesData, options: timeSeriesOption };

  console.log('DevTendency', data);
  console.log('DevTendency chartData', chartData);

  return (
    <div>
      <div>
        <Chart {...timeSeriesChartConfig} />
      </div>
    </div>
  );
}

export default DevTendency;
