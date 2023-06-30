import '../../Community.css';
import TinyBoardArticle from './TinyBoardArticle/index.jsx';

export default function TinyBoard_Presenter(props) {
  const { board_name, board_id, articles, onBoard } = props;

  return (
    <div>
      <div className="main-board-head d-flex justify-content-between">
        <div className="main-board-title">{board_name} 게시판</div>
        <div className="main-board-more" onClick={onBoard}>
          더보기 &gt;
        </div>
      </div>
      <div className="article-list-section">
        {articles.map((article) => (
          <TinyBoardArticle key={article} />
        ))}
      </div>
    </div>
  );
}
