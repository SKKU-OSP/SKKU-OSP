import axios from 'axios';
import { tokenRemover, getAuthConfig } from './auth';
const domain_url = import.meta.env.VITE_SERVER_URL;
const logout_url = `${domain_url}/accounts/logout/`;

// Interceptor를 적용한 Axios 인스턴스
const axiosInstance = axios.create({
  baseURL: domain_url,
  timeout: 10000
});

// Interceptor 내부에서 api 호출 시 무한반복 방지를 위해서 Interceptor를 적용하지 않는 Axios 인스턴스
const plainAxiosInstance = axios.create({
  baseURL: domain_url,
  timeout: 10000
});

// React Router의 navigate를 저장하기 위한 변수
let navigate = null;

// navigate 설정 함수
export const setNavigate = (navigateFunction) => {
  navigate = navigateFunction;
};

// // Request Interceptor
// // 요청을 보내기 전 Base URL 설정과 Authorization Header 설정
// axiosInstance.interceptors.request.use(
//   () => getAuthConfig(), // TODO : 추후 getAuthCongig 함수도 수정 필요
//   (error) => Promise.reject(error)
// );

// Response Interceptor
// 401 에러 발생 시 토큰 제거 후 로그아웃 요청
axiosInstance.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 반환
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // Interceptor를 적용하지 않는 인스턴스로 로그아웃 요청
        tokenRemover(); // 토큰 제거
        await plainAxiosInstance.get(logout_url);
        alert('로그인이 만료되었습니다. 로그인 화면으로 이동합니다.');
        navigate('/accounts/login'); // React Router로 로그인 화면 이동
      } catch (logoutError) {
        console.error('로그아웃 요청 중 에러 발생:', logoutError);
      }
    }
    return Promise.reject(error); // 에러를 그대로 반환
  }
);

export default axiosInstance;
