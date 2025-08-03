import InquiryBoard_Presenter from './InquiryBoard_Presenter';
import axios from 'axios';
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../utils/auth-context';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function InquiryBoard() {
  const navigate = useNavigate();
  const tabName = '자유'; // 백엔드 구현 전까지 임시로 자유게시판 렌더링
  const [isLoadedArticles, setIsLoadedArticles] = useState(false);
  const [articles, setArticles] = useState([]);
  const [maxPageNumber, setMaxPageNumber] = useState(0);
  const [nowPage, setNowPage] = useState(1);
  const [error, setError] = useState(false);
  const { username } = useContext(AuthContext);

  const onWrite = () => {
    if (username) {
      navigate(`/community/board/${tabName}/register`); // 문의게시판 등록 페이지로 이동
    } else {
      if (confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      }
    }
  };

  const getArticles = async (page) => {
    try {
      const response = await axios.get(server_url + `/community/api/board/${tabName}/?page_number=${page}`);
      const res = response.data;
      if (res.status === 'success') {
        setArticles(res.data.articles);
        setMaxPageNumber(res.data.max_page_number);
        setIsLoadedArticles(true);
        setNowPage(page);
      } else {
        alert('해당 게시판이 존재하지 않습니다.');
        navigate('/community');
      }
    } catch (error) {
      setError(true);
      setIsLoadedArticles(true);
      setArticles([]);
    }
  };

  const onPageChange = (page) => {
    getArticles(page);
  };

  useEffect(() => {
    getArticles(1);
  }, [tabName]);

  return (
    <InquiryBoard_Presenter
      isLoadedArticles={isLoadedArticles}
      articles={articles}
      onWrite={onWrite}
      tabName={tabName}
      maxPageNumber={maxPageNumber}
      nowPage={nowPage}
      onPageChange={onPageChange}
      userName={username}
    />
  );
}
