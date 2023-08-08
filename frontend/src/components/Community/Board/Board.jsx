import '../Board/Board.css';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import axios from 'axios'; 

const domainUrl = import.meta.env.VITE_SERVER_URL

function Board({type}) {
  const url = domainUrl + "/community/"
  const urlBoard = domainUrl + "/community/board"
  const boardName = useParams().board_name
  const [board, setBoard] = useState([]);
  const [isExistBoard, setIsExisBoard] = useState(false);

  useEffect(() => {
    // 존재하는 게시판인지 확인
    setIsExisBoard(true);
    const getBoard = async() => {
      const response = await axios.get(url);
      const res = response.data;
      setBoard(res.data.boards.map(n => {
        return{
          id: n.id, name: n.name, board_type: n.board_type
        }
      }));
    }
    getBoard()
  }, []);
  console.log(board);

  const onClick = () => {
    window.location.href = `/community/` + boardName + `/register`;
  }

  return (
    <div id='community-main' className="col-md-9">
      <div id="community-bar" className="flex-between">
        <div id="community-title" className="p-board-title">
          <a href="">자유</a>
        </div>
        <div id="community-others" className="p-board-title">
          <a href="">질문</a>
        </div>
        <div id="community-others" className="p-board-title">
          <a href="">정보</a>
        </div>
        <div id="community-others" className="p-board-title">
          <a href="">홍보</a>
        </div>
        <Button variant="transparent" onClick={onClick} type="button" id="btn-content-edit">
          작성하기
        </Button>
      </div>
      <form id="article-form" method="post" data-edit-type={type} encType="multipart/form-data">

      </form>
    </div>
  );
}

export default Board;