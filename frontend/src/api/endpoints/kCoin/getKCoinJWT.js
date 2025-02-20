import axiosInstance from '../../../utils/axiosInterCeptor';

export const getSecretJWT = async (userId) => {
  const response = await axiosInstance.get(`/challenge/api/secret/${userId}/`);
  const res = response.data;
  // TODO 추후 킹고코인 관련 코드 추가 예정정
  // console.log(res);
  return res;
};
