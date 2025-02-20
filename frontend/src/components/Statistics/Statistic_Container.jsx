import { useChartData } from '../../api/reactQuery/statistics/useChartData';
import AnnualOverviews from './AnnualOverviews';
import CaseSelectors from './CaseSelectors';
import StatisticMain from './StatisticMain';
import LoaderIcon from 'react-loader-icon';

function Statistic_Container() {
  const { isLoading } = useChartData();

  if (isLoading) {
    return <LoaderIcon style={{ marginTop: 300, marginBottom: 300 }} />;
  }

  return (
    <>
      <CaseSelectors />
      <AnnualOverviews />
      <StatisticMain />
    </>
  );
}

export default Statistic_Container;
