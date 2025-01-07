import axios from 'axios';
import { tokenRemover } from './auth'; // 사용자 정의 토큰 제거 함수

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

// Response Interceptor
// 401 에러 발생 시 로그아웃 요청 후 토큰 제거
axiosInstance.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 반환
  async (error) => {
    console.log('인터셉터 에러 발생');
    if (error.response?.status === 401) {
      try {
        // Interceptor를 적용하지 않는 인스턴스로 로그아웃 요청
        await plainAxiosInstance.get(logout_url);
        tokenRemover(); // 토큰 제거
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
