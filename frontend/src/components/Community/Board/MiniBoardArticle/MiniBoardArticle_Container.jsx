import ReactGA from 'react-ga4';
import { useNavigate } from 'react-router-dom';

import MiniBoardArticle_Presenter from './MiniBoardArticle_Presenter';

export default function MiniBoardArticle_Container(props) {
  const { article } = props;
  const navigate = useNavigate();

  const onArticle = () => {
    navigate(`/community/article/${article.id}`);
    ReactGA.event({
      category: 'Article',
      action: 'Access_Article_From_Main',
      label: '게시판 접근(메인)'
    });
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options).replace(/\.\s/g, '.').replace(/\.$/, '');
  };

  return <MiniBoardArticle_Presenter article={article} pubDate={formatDate(article.pub_date)} onArticle={onArticle} />;
}
