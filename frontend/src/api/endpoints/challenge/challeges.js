import axiosInstance from '../../../utils/axiosInterCeptor';

export const getChallengeList = async (userId) => {
  const response = await axiosInstance.get(`challenge/api/update/${userId}/`);
  const res = response.data;
  return res;
};

export const updateChallenge = async (userId) => {
  axiosInstance.get(`/challenge/api/update/${userId}/`);
};
