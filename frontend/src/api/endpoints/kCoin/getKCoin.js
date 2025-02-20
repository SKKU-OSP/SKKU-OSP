import axiosInstance from '../../../utils/axiosInterCeptor';

const KCoinUrl = `http://kingocoin-dev.cs.skku.edu:8080/api/auth/platform?name=오픈소스플랫폼`;
export const getKCoinJWT = async (JWT) => {
  const response = await axiosInstance.get(KCoinUrl, {
    headers: {
      'Authorization-Temp': `bearer ${JWT}`
    }
  });
  const res = response.data;
  return res;
};
