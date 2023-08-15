import { useState } from 'react';
import AnnualDetails from './AnnualDetails';
import FactorDists from './FactorDists';

function StatisticMain({ detailData, distData, isReady, years, factorsClassNum, factorLevelStep }) {
  const [targetYear, setTargetYear] = useState(2023);

  return (
    <>
      <AnnualDetails
        detailData={detailData}
        isReady={isReady}
        years={years}
        targetYear={targetYear}
        onSetYear={setTargetYear}
      />
      <FactorDists
        distData={distData}
        isReady={isReady}
        targetYear={targetYear}
        factorsClassNum={factorsClassNum}
        factorLevelStep={factorLevelStep}
      />
    </>
  );
}

export default StatisticMain;
