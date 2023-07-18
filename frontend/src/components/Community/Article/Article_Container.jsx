import Article_Presenter from './Article_Presenter';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Article_Container() {
  const { article_id } = useParams();
  const [isExistArticle, setIsExisArticle] = useState(false);

  useEffect(() => {
    // 존재하는 게시판인지 확인
    setIsExisArticle(true);
  });

  return <Article_Presenter isExistArticle={isExistArticle} article_id={article_id} />;
}

export default Article_Container;
