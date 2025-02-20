import axiosInstance from '../../../utils/axiosInterCeptor';

export const getChallengeUpdate = async (userId) => {
  const response = await axiosInstance.get(`/challenge/api/update/${userId}/`);
  const res = response.data;
  return res;
};
