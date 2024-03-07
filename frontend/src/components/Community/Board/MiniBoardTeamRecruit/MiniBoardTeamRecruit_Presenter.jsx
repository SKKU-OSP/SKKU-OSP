import '../Board.css';

export default function MiniBoardTeamRecruit_Presenter(props) {
  const { article, pubDate, onArticle } = props;

  return (
    <div className="mini-board-article">
      {article.title ? (
        <>
          <div className="mini-board-article-header">
            <div className="mini-board-team-recruit" style={{ flexBasis: '15%' }}>
              {article?.period_end && new Date(article.period_end) > new Date() ? (
                <span className="mini-board-team-recruit-on">모집중</span>
              ) : (
                <span className="mini-board-team-recruit-off">모집마감</span>
              )}
            </div>
            {article.team_name ? (
              <>
                <div className="mini-board-article-main" style={{ flexBasis: '63%' }}>
                  <h6 className="mini-board-article-title" onClick={onArticle}>
                    [{article.team_name}] {article.title}
                  </h6>
                </div>
                <div className="mini-board-article-info" style={{ flexBasis: '22%' }}>
                  <div className="mini-board-article-pubdate">{pubDate}</div>
                </div>
              </>
            ) : (
              <>
                <div className="mini-board-article-main" style={{ flexBasis: '63%' }}>
                  <h6 className="mini-board-article-title" onClick={onArticle}>
                    [] {article.title}
                  </h6>
                </div>
                <div className="mini-board-article-info" style={{ flexBasis: '22%' }}>
                  <div className="mini-board-article-pubdate">{pubDate}</div>
                </div>
              </>
            )}
          </div>

          <div className="float-clear"></div>
        </>
      ) : (
        <h5>작성된 모집글이 없습니다.</h5>
      )}
    </div>
  );
}
