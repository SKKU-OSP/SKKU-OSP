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

  // react qeury v5 에서는 onSuccess가 삭제되어 useEffect를 이용하여 전역 데이터 동기화
  React.useEffect(() => {
    if (query.data) {
      setChartData(query.data);
    }
  }, [query.data]);
  return query;
};
