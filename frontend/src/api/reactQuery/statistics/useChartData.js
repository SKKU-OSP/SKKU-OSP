import React from 'react';
import { getChartData } from '../../endpoints/statistics/getChartData';
import { useQuery } from '@tanstack/react-query';
import { useChartDataStore } from '../../../stores/statistics/chartDataStore';

export const useChartData = () => {
  const { setChartData } = useChartDataStore();

  const query = useQuery({
    queryKey: ['chartData'],
    queryFn: getChartData
  });

  React.useEffect(() => {
    if (query.data) {
      setChartData(query.data);
    }
  }, [query.data]);
  return query;
};
