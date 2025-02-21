import axiosInstance from '../../../utils/axiosInterCeptor';

export const getTeamList = async (page, sort) => {
  const response = await axiosInstance.get(`/team/api/teams-list/?page_number=${page}&sort=${sort}`);
  const res = response.data;
  return res;
};
