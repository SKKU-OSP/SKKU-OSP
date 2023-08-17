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
  const board_ids = {'자유': 0, '질문': 1, '정보': 5, '홍보': 6};

  const getArticle = async () => {
    try {
      const board_id = board_ids[board_name]
      const response = await axios.get(server_url + `/community/api/board/${board_id}`);
      const res = response.data;
      if (res.status === 'success') {
        setArticles(res.data.articles);
      }
    } catch (error) {
      setError(true);
    }
  };

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
    // 존재하는 게시판인지 확인
    if (!board_names.includes(board_name)) {
      alert('존재하지 않는 게시판입니다.');
      navigate('/community/board/자유');
    } else {
      getArticle();
    }
  });

  return <Board_Presenter articles={articles} onWrite={onWrite} />;
}
