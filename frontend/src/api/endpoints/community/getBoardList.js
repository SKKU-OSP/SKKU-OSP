import axiosInstance from '../../../utils/axiosInterCeptor';

export const getBoardList = async (tabName, page, sort) => {
  const response = await axiosInstance.get(`/community/api/board/${tabName}/?page_number=${page}&sort=${sort}`);
  const res = response.data;
  return res;
};
