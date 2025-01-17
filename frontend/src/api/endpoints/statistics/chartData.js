import axiosInstance from '../../utils/axiosInterceptor';

const domain_url = import.meta.env.VITE_SERVER_URL;

export const getChartData = async () => {
  const response = await axiosInstance.get(domain_url + '/home/api/statistic/');
  const res = response.data;
  if (res.status === 'success') {
    return res.data;
  } else {
    // TODO : error throw 하는 방식으로 추후 수정 필요
    return res.message;
  }
};
