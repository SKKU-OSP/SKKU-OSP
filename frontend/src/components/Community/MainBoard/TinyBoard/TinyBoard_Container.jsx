import TinyBoard_Presenter from './TinyBoard_Presenter';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
// import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function TinyBoard_Container(props) {
  // const BASE_URL = process.env.VITE_SERVER_URL;
  // const dispatch = useDispatch();
  const navigate = useNavigate();

  const { board_name, board_id } = props;
  const [articles, setArticles] = useState([1, 2, 3, 4, 5]);

  // const getArticles = () => {
  //   axios
  //     .get(`${BASE_URL}/`)
  //     .then((response) => {
  //       setArticles(response.data);
  //     })
  //     .catch((error) => dispatch());
  // };

  // useEffect(() => {
  //   getArticles();
  // });

  const onBoard = () => {
    navigate(`/community/board/${board_name}/${board_id}`);
  };

  return <TinyBoard_Presenter board_name={board_name} board_id={board_id} articles={articles} onBoard={onBoard} />;
}
