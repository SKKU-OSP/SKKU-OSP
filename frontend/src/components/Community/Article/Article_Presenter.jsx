import '../Community.css';
import './Article.css';
import ContentView from './TinyArticle/ContentView';
import Comment from './TinyArticle/Comment';
import Spinner from 'react-bootstrap/Spinner';

function Article_Presenter(props) {
  const need_login = false;
  const need_member = false;
  const type = 'view';
  // 아직 API로 필요한 것들
  const article = props.article;
  const tags = props.tags;
  const comments = props.comments;
  const board = props.board;

  return (
    <div className="col-md-9 community-main">
      {need_login && (
        <div className="m-2">
          로그인이 필요한 서비스입니다. <a href="/accounts/login/">바로가기</a>
        </div>
      )}
      {!need_login && need_member && (
        <div className="m-2">
          팀 멤버만 열람할 수 있습니다. <a href={`/community/board/팀 모집/2`}>팀 모집 게시판 확인하기</a>
        </div>
      )}
      {!need_login && !need_member && (
        <>
          <div className="article-content">
            {type === 'view' ? (
              <ContentView board={board} tags={tags} comments={comments} article={article} />
            ) : (
              <>{/* <Content_Edit /> */}</>
            )}
          </div>
          <div id="comment-content">{type !== 'register' && <Comment comments={comments} article={article} />}</div>
        </>
      )}
    </div>
  );
}
export default Article_Presenter;
