import BoardArticle_Presenter from './BoardArticle_Presenter';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function BoardArticle_Container(props) {
  const { article } = props;
  const navigate = useNavigate();

  const onArticle = () => {
    navigate(`/community/article/${article.id}`)
  };

  const onWriter = () => {
    navigate(`/user/${article.writer.user.username}`)
  };

  useEffect(() => {
  });

  return <BoardArticle_Presenter article={article} onArticle={onArticle} onWriter={onWriter} />;
}
