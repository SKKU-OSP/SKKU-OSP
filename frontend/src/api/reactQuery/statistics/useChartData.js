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
      const detailData = data?.annual_total.find((item) => item.case_num === caseNum);
      const distData = data?.annual_data.factor.find((item) => item.case_num === caseNum);
      // 레거시 코드에서 사용하는 데이터
      // 추후 컴포넌트 수정 시 제거
      distData.depts = data?.depts;
      distData.sids = data?.sids;
      distData.factors = data?.factors;
      return {
        ...data,
        overviewData: overviewData || {},
        detailData: detailData || {},
        distData: distData || {}
      };
    }
  });

  return query;
};
