import BoardArticle_Presenter from './BoardArticle_Presenter';
import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../../../../utils/auth-context';
import ReactGA from 'react-ga4';

export default function BoardArticle_Container(props) {
  const { article } = props;
  const navigate = useNavigate();

  const onArticle = () => {
    ReactGA.event({
      category: 'Article',
      action: 'Access_Article_From_Board',
      label: '게시글 접속(게시판)'
    });
    navigate(`/community/article/${article.id}`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options).replace(/\.\s/g, '.').replace(/\.$/, '');
  };

  return <BoardArticle_Presenter article={article} pubDate={formatDate(article.pub_date)} onArticle={onArticle} />;
}
