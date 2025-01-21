import AnnualOverviews from './AnnualOverviews';
import CaseSelectors from './CaseSelectors';
import StatisticMain from './StatisticMain';

import { useChartData } from '../../api/reactQuery/statistics/useChartData';
import { useChartDataStore } from '../../stores/statistics/chartDataStore';

function Statistic_Container() {
  const { isLoading, isError } = useChartData();

  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <>
      <CaseSelectors />
      <AnnualOverviews />
      <StatisticMain />
    </>
  );
}

export default Statistic_Container;
