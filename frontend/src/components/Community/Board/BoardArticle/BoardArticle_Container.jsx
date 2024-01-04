import BoardArticle_Presenter from './BoardArticle_Presenter';
import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../../../../utils/auth-context';

export default function BoardArticle_Container(props) {
  const { article } = props;
  const navigate = useNavigate();

  const onArticle = () => {
    navigate(`/community/article/${article.id}`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options).replace(/\.\s/g, '.').replace(/\.$/, '');
  };

  return <BoardArticle_Presenter article={article} pubDate={formatDate(article.pub_date)} onArticle={onArticle} />;
}
