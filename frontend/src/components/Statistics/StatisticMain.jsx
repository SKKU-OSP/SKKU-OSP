import AnnualDetails from './AnnualDetails';
import FactorDists from './FactorDists';
import { useChartData } from '../../api/reactQuery/statistics/useChartData';
import { useChartFilterStore } from '../../stores/statistics/chartDataStore';

function StatisticMain() {
  const { data, isLoading, isError } = useChartData();
  const { year, setYear } = useChartFilterStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // TODO: 아래 컴포넌트 분석 후 props 모두 제거 예정정
  return (
    <>
      <AnnualDetails
        detailData={data.detailData}
        userData={data.student_data}
        isReady={!isLoading}
        years={data.years}
        targetYear={year}
        onSetYear={setYear}
      />

      <FactorDists
        distData={data.distData}
        isReady={!isLoading}
        targetYear={year}
        factorsClassNum={data.overviewData.class_num}
        factorLevelStep={data.overviewData.level_step}
      />
    </>
  );
}

export default StatisticMain;
