import '../Board.css';

export default function MiniBoardArticle_Presenter(props) {
  const { article, pubDate, onArticle } = props;
  return (
    <div className="mini-board-article">
      {article.title ? (
        <>
          <div className="mini-board-article-header">
            <div className="mini-board-article-main">
              <h6 className="mini-board-article-title" onClick={onArticle}>
                {article.title}
              </h6>
            </div>
            <div className="mini-board-article-info">
              <div className="mini-board-article-pubdate">{pubDate}</div>
            </div>
          </div>

          <div className="float-clear"></div>
        </>
      ) : (
        <h5>작성된 글이 없습니다.</h5>
      )}
    </div>
  );
}
