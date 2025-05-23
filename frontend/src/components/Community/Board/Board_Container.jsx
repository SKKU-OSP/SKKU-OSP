import Board_Presenter from './Board_Presenter';
import axios from 'axios';
import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../../../utils/auth-context';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function Board_Container() {
  // tabName으로 '홍보', '자유', '질문', '정보' 를 받아 게시판의 게시글 목록을 렌더링
  const navigate = useNavigate();
  const { tabName } = useParams();
  const [isLoadedArticles, setIsLoadedArticles] = useState(false);
  const [articles, setArticles] = useState([]);
  const [maxPageNumber, setMaxPageNumber] = useState(0);
  const [nowPage, setNowPage] = useState(1);
  const [error, setError] = useState(false);
  const { username } = useContext(AuthContext);

  const onWrite = () => {
    if (username) {
      navigate(`/community/board/${tabName}/register`);
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
    <Board_Presenter
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
