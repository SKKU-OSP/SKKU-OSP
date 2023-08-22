import BoardArticle_Presenter from './BoardArticle_Presenter';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function BoardArticle_Container(props) {
  const { article } = props;
  const [pubDate, setPubDate] = useState('');
  const navigate = useNavigate();

  const onArticle = () => {
    navigate(`/community/article/${article.id}`);
  };

  const onWriter = () => {
    navigate(`/user/${article.writer.user.username}`);
  };

  const getDate = (date) => {
    const now = new Date();
    const article_date = new Date(date);
    const delta = now.getTime() - article_date.getTime();

    if (delta / (60 * 1000) < 1) {
      setPubDate('방금');
    } else if (delta / (60 * 1000) < 60) {
      setPubDate((delta / (60 * 1000)).toFixed() + '분 전');
    } else if (delta / (60 * 60 * 1000) < 24) {
      setPubDate((delta / (60 * 60 * 1000)).toFixed() + '시간 전');
    } else if (delta / (24 * 60 * 60 * 1000) < 31) {
      setPubDate((delta / (24 * 60 * 60 * 1000)).toFixed() + '일 전');
    } else {
      setPubDate(date.substring(0, 10));
    }
  };

  useEffect(() => {
    getDate(article.pub_date);
  });

  return <BoardArticle_Presenter article={article} pubDate={pubDate} onArticle={onArticle} onWriter={onWriter} />;
}
