import SearchArticle_Presenter from './SearchArticle_Presenter';
import { useNavigate } from 'react-router-dom';

export default function SearchArticle_Container(props) {
  const article = props.article;
  const navigate = useNavigate();
  console.log('article', article);

  const onArticle = () => {
    navigate(`/community/article/${article.id}`);
  };

  const onWriter = () => {
    navigate(`/user/${article.writer.user.username}`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options).replace(/\.\s/g, '.').replace(/\.$/, '');
  };

  const onBoard = () => {
    if (article.board.board_type === 'Team') {
      navigate(`/community/team/${article.board.name}`);
    } else if (article.board.board_type === 'General') {
      navigate(`/community/board/${article.board.name}`);
    } else if (article.board.board_type === 'Recruit') {
      navigate(`/community/recruit/${article.board.name}`);
    }
  };

  return (
    <SearchArticle_Presenter
      article={article}
      pubDate={formatDate(article.pub_date)}
      onArticle={onArticle}
      onWriter={onWriter}
      onBoard={onBoard}
    />
  );
}
