import Board_Presenter from './Board_Presenter';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Board_Container() {
  const navigate = useNavigate();
  const { board_name } = useParams();
  const [articles, setArticles] = useState([]);
  const board_names = ['자유', '질문', '정보', '홍보'];

  useEffect(() => {
    // 존재하는 게시판인지 확인
    if (!board_names.includes(board_name)) {
      alert('존재하지 않는 게시판입니다.');
      navigate('/community/자유');
    } else {
    }
  });

  return <Board_Presenter board_name={board_name} />;
}
