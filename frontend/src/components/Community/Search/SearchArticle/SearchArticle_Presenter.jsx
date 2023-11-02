import { BsHandThumbsUp, BsFillChatLeftTextFill, BsBookmark, BsEyeFill } from 'react-icons/bs';

function SearchArticle_Presenter(props) {
  const { article, onArticle, onWriter } = props;
  return (
    <div className="board-article">
      <h6>
        {article.anonymous_writer ? (
          <span className="board-article-writer" onClick={onWriter}>
            익명
          </span>
        ) : (
          <span>{article.writer.user.username}</span>
        )}{' '}
        {article.pub_date.substring(0, 10)}
        <span style={{ float: 'right' }}>{article.board.name} 게시판</span>
      </h6>
      <h4 className="board-article-title" onClick={onArticle}>
        {article.title}
      </h4>
      <div className="d-flex justify-content-between">
        <div>
          {article.tags.length > 0 &&
            article.tags.map((tag, index) => (
              <h6 className="inline board-article-tag" key={tag.name}>
                #{tag.name.replace(' ', '_')}&nbsp;
              </h6>
            ))}
        </div>
        <div className="board-article-meta-list">
          <BsHandThumbsUp size={13} className="board-article-meta" /> {article.like_cnt}
          <BsFillChatLeftTextFill size={13} className="board-article-meta" /> {article.comment_cnt}
          <BsBookmark size={13} className="board-article-meta" /> {article.scrap_cnt}
          <BsEyeFill size={13} className="board-article-meta" /> {article.view_cnt}
        </div>
      </div>
    </div>
  );
}

export default SearchArticle_Presenter;
