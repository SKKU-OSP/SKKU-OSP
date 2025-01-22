import axiosInstance from '../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../utils/auth';
const serverDomain = import.meta.env.VITE_SERVER_URL;

export const getChartData = async () => {
  const response = await axiosInstance.get(`${serverDomain}/home/api/statistic/`, getAuthConfig());
  const res = response.data;
  if (res.status === 'success') {
    return res.data;
  } else {
    return res.message;
  }
};
