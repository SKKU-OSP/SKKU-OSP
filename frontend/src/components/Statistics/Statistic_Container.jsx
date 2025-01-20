import { useChartData } from '../../api/reactQuery/statistics/useChartData';
import { useChartDataStore } from '../../stores/statistics/chartDataStore';

function Statistic_Container() {
  const { data, isLoading } = useChartData();
  const { chartData } = useChartDataStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log('chartData: ', chartData);
  console.log('data: ', data);

  return <div>{JSON.stringify(chartData)}</div>;
}

export default Statistic_Container;
