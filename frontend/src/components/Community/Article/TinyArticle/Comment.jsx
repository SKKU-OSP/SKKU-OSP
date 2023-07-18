import '../../Community.css';
import '../Article.css';
import '../base.css';
import Comment_Item from './Comment_Item';

function Comment(props) {
  const request = { user: { is_authenticated: true } };
  const comments = props.comments;
  const article = props.article;
  const article_id = 164;
  console.log(comments);
  return (
    <>
      {request.user.is_authenticated ? (
        <div id="comment-group-login">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div id={`comment-${comment.id}`} className="comment-item">
                <Comment_Item comments={comment} />
              </div>
            ))
          ) : (
            <div className="comment-none">등록된 댓글이 없습니다.</div>
          )}
        </div>
      ) : (
        <div id="comment-group-logout">
          {comments.length > 0 ? (
            comments.map((comment, index) => {
              comments.length !== index ? (
                <div id={`comment-${comment.id}`} className="comment-item">
                  <Comment_Item comments={comment} />
                </div>
              ) : (
                <div id={`comment-${comment.id}`} className="comment-item-last">
                  <Comment_Item comments={comment} />
                </div>
              );
            })
          ) : (
            <div className="comment-none">등록된 댓글이 없습니다.</div>
          )}
        </div>
      )}
      {request.user.is_authenticated && (
        <form id="comment-form" method="post">
          {/* {% csrf_token %} */}
          <input type="hidden" id="comment-article-id" name="article-id" value={article_id} />
          <div id="comment-input">
            <div id="comment-annonymous">
              <label for="comment-is-anonymous">익명</label>
              <input type="checkbox" id="comment-is-anonymous" checked />
            </div>
            <textarea id="comment-body" className="form-control" placeholder="댓글을 입력해주세요." required></textarea>
            <button type="button" id="btn-comment-save" className="hover-opacity" /*onclick={comment.save()}*/>
              댓글 쓰기
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export default Comment;
