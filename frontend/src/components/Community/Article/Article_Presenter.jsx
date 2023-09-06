import '../Community.css';
import './Article.css';
import ContentView from './TinyArticle/ContentView';
import Comment from './TinyArticle/Comment';

function Article_Presenter(props) {
  const { username, data, canView } = props;

  return (
    <div className="col-9">
      {!canView ? (
        <div className="m-2">
          팀 멤버만 열람할 수 있습니다. <a href={`/community/board/팀 모집/2`}>팀 모집 게시판 확인하기</a>
        </div>
      ) : (
        <>
          <div className="article-content">
            <ContentView data={data} />
          </div>
          {username && (
            <div id="comment-content">
              <Comment comments={data.comments} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default Article_Presenter;
