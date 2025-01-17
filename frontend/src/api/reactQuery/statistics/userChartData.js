import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChartData } from '../../api/endpoints/statistics/chartData';

export const useChartDataQuery = (caseNum) => {
  return useQuery(['chartData', caseNum], async () => {
    const data = await getChartData();
  });
};
