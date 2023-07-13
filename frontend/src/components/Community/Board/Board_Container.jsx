import Board_Presenter from './Board_Presenter';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Board_Container() {
  const { board_name } = useParams();
  const [isExistBoard, setIsExisBoard] = useState(false);

  useEffect(() => {
    // 존재하는 게시판인지 확인
    setIsExisBoard(true);
  });

  return <Board_Presenter isExistBoard={isExistBoard} board_name={board_name} />;
}
