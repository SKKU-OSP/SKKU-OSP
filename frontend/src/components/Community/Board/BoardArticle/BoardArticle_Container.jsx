import BoardArticle_Presenter from './BoardArticle_Presenter';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function BoardArticle_Container() {
  const navigate = useNavigate();
  const { board_name } = useParams();

  useEffect(() => {
    console.log('hi');
  });

  return <BoardArticle_Presenter board_name={board_name} />;
}
