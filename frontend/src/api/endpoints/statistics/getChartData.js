import axiosInstance from '../../../utils/axiosInterCeptor';

export const getChartData = async () => {
  const response = await axiosInstance.get(`/home/api/statistic/`);
  const res = response.data;
  if (res.status === 'success') {
    return res.data;
  } else {
    return res.message;
  }
};
