import '../../Community.css';
import '../Article.css';

function Comment_Item(props) {
  const comment = props.comments;
  const request = { user: { username: 'hoya', id: 1234, is_authenticated: false, is_superuser: false } };
  const user = { id: 1234 };
  const is_comment_like = false;
  return (
    <>
      <div className="comment-item-left">
        <div className="comment-item-writer-wrapper">
          {comment.anonymous_writer ? (
            <div className="comment-item-writer annonymous">익명</div>
          ) : request.user.is_authenticated ? (
            <div className="comment-item-writer dropdown writer-dropdown">
              <button
                className="dropdown-toggle writer-dropdown-btn"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {comment.writer} {/*comment.writer.user.username*/}
              </button>
              <ul className="dropdown-menu">
                {!comment.writer.user.is_superuser && (
                  <li>
                    <a className="dropdown-item" href={`/user/${comment.writer}`}>
                      {' '}
                      {/*comment.writer.user.username*/}
                      프로필
                    </a>
                  </li>
                )}
                <li>
                  <a className="dropdown-item" onclick={`msgModalOpen(${comment.writer})`}>
                    {' '}
                    {/*comment.writer.user.id*/}
                    메시지
                  </a>
                </li>
              </ul>
            </div>
          ) : (
            <div className="comment-item-writer">{comment.writer}</div>
            //comment.writer.user.username
          )}
          {request.user.id == comment.writer && (
            <div className="comment-item-delete">
              <span onclick={`comment.delete(${comment.id});`}>삭제</span>
            </div>
          )}{' '}
          {/*request.user == comment.writer.user*/}
        </div>
        <div className="comment-item-body">{comment.body}</div>
      </div>
      <div className="comment-item-right">
        <div className="comment-item-datetime">
          <div>{comment.pub_date}</div>
          <div>{comment.pub_date}</div>
        </div>
        <div className="comment-item-mod">
          {/* {% is_comment_like comment request.user as is_comment_like %} */}
          <div className="comment-item-like" onclick={`CommentLike(${comment.id}, ${user.id})`}>
            {is_comment_like ? (
              <span className="material-icons">thumb_up</span>
            ) : (
              <span className="material-icons-outlined">thumb_up</span>
            )}
          </div>
          <div className="comment-item-like-cnt">{comment.like}</div>
        </div>
      </div>
    </>
  );
}

export default Comment_Item;
