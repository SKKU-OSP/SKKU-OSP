import Board_Presenter from './Board_Presenter';
import axios from 'axios';
import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../../../utils/auth-context';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function Board_Container() {
  const navigate = useNavigate();
  const { board_name } = useParams();
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(false);
  const { username } = useContext(AuthContext);

  const board_names = ['자유', '질문', '정보', '홍보'];

  const onWrite = () => {
    if (username) {
      navigate(`/community/board/${board_name}/register`);
    } else {
      if (confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      }
    }
  };

  useEffect(() => {
    const getArticle = async () => {
      try {
        const response = await axios.get(server_url + `/community/api/board/${board_name}`);
        const res = response.data;
        if (res.status === 'success') {
          setArticles(res.data.articles);
        } else {
          alert('해당 게시판이 존재하지 않습니다.');
        }
      } catch (error) {
        setError(true);
      }
    };
    getArticle();
  }, [board_name]);

  return <Board_Presenter articles={articles} onWrite={onWrite} />;
}
