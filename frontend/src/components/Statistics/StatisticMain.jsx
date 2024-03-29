import { useState } from 'react';
import AnnualDetails from './AnnualDetails';
import FactorDists from './FactorDists';

function StatisticMain(props) {
  const { detailData, distData, userData, isReady, years, factorsClassNum, factorLevelStep } = props;
  const [targetYear, setTargetYear] = useState(2023);

  return (
    <>
      <AnnualDetails
        detailData={detailData}
        userData={userData}
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
