import MiniBoardTeamRecruit_Presenter from './MiniBoardTeamRecruit_Presenter';
import { useNavigate } from 'react-router-dom';

export default function MiniBoardTeamRecruit_Container(props) {
  const { article } = props;
  const navigate = useNavigate();

  const onArticle = () => {
    navigate(`/community/article/${article.id}/`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options).replace(/\.\s/g, '.').replace(/\.$/, '');
  };

  return (
    <MiniBoardTeamRecruit_Presenter article={article} pubDate={formatDate(article.pub_date)} onArticle={onArticle} />
  );
}
