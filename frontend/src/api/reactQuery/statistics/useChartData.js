// import React from 'react';
import { getChartData } from '../../endpoints/statistics/getChartData';
import { useQuery } from '@tanstack/react-query';
import { useChartFilterStore } from '../../../stores/statistics/chartDataStore';

export const useChartData = () => {
  const { caseNum } = useChartFilterStore();

  const query = useQuery({
    queryKey: ['chartData'],
    queryFn: getChartData,
    select: (data) => {
      const overviewData = data?.annual_overview.find((item) => item.case_num === caseNum);
      return {
        ...data,
        overviewData: overviewData || {}
      };
    }
  });

  return query;
};
