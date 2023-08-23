import SearchArticle_Presenter from './SearchArticle_Presenter';
import { useNavigate } from 'react-router-dom';

export default function BoardArticle_Container(props) {
  const article = props.article;
  const navigate = useNavigate();

  const onArticle = () => {
    navigate(`/community/article/${article.id}`);
  };

  const onWriter = () => {
    navigate(`/user/${article.writer.user.username}`);
  };

  return <SearchArticle_Presenter article={article} onArticle={onArticle} onWriter={onWriter} />;
}
