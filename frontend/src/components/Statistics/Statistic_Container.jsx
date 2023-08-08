import { useEffect } from 'react';
import AnnualDetails from './AnnualDetails';
import AnnualOverviews from './AnnualOverviews';
import AnnualSelectors from './AnnualSelectors';
import CaseSelectors from './CaseSelectors';
import FactorDists from './FactorDists';
import FactorSelectors from './FactorSelectors';

import axios from 'axios';
import { getAuthConfig } from '../../utils/auth';

function Statistic_Container() {
  useEffect(() => {
    console.log('Statistic_Container useEffect');
    const getStatisticData = async () => {
      axios.get(url, getAuthConfig());
    };

    getStatisticData();
  }, []);
  return (
    <>
      <CaseSelectors />
      <AnnualOverviews />
      <AnnualSelectors />
      <AnnualDetails />
      <FactorSelectors />
      <FactorDists />
    </>
  );
}

export default Statistic_Container;
