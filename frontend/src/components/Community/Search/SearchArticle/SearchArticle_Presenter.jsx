import { BsHandThumbsUp, BsChatLeftText, BsBookmark, BsEye } from 'react-icons/bs';

function SearchArticle_Presenter(props) {
  const { article, pubDate, onArticle, onWriter, onBoard } = props;

  return (
    <div className="board-article">
      <div className="board-article-header">
        <div className="board-article-main" style={{ flexBasis: '50%' }}>
          <h4 className="board-article-title" onClick={onArticle}>
            {article.title}
          </h4>
          <div className="board-article-tags">
            {article.tags && article.tags.length > 0 ? (
              <>
                {article.tags.map((tag) => (
                  <h6 className="inline board-article-tag" key={tag.name}>
                    #{tag.name.replace(' ', '_')}&nbsp;
                  </h6>
                ))}
              </>
            ) : null}
          </div>
        </div>
        <div className="board-article-info" style={{ flexBasis: '50%' }}>
          <div className="board-article-writer2">
            {article.writer ? (
              article.anonymous_writer ? (
                <span className="board-article-writer" onClick={onWriter}>
                  익명
                </span>
              ) : (
                <span>{article.writer.user.username}</span>
              )
            ) : (
              <span>탈퇴한 이용자 </span>
            )}
          </div>
          <div className="board-article-type" onClick={onBoard}>
            {article.board.name} 게시판
          </div>
          <div style={{ flexBasis: '40%' }}>
            <div className="board-article-pubdate">{pubDate}</div>
            <div className="board-article-meta-list">
              <BsHandThumbsUp size={12} className="board-article-meta" /> {article.like_cnt}
              <BsChatLeftText size={12} className="board-article-meta" /> {article.comment_cnt}
              <BsBookmark size={12} className="board-article-meta" /> {article.scrap_cnt}
              <BsEye size={12} className="board-article-meta" /> {article.view_cnt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchArticle_Presenter;
