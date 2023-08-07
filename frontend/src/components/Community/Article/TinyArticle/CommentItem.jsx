import '../../Community.css';
import '../Article.css';
import '../base.css';
import { FaRegThumbsUp, FaThumbsUp } from 'react-icons/fa';

function CommentItem(props) {
  const request = { user: { username: 'hoya', id: 1234, is_authenticated: false, is_superuser: false } };
  const is_comment_like = false;
  // API 필요한 부분

  const comment = props.comments;

  let pub_date1, pub_date2;
  const dateObject = new Date(comment.pub_date);
  pub_date1 = dateObject.toISOString().slice(0, 10);
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const period = hours >= 12 ? 'p.m.' : 'a.m.';
  const formattedHours = hours % 12 || 12;
  pub_date2 = `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  // 날짜 표현

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
                {comment.writer.user.username}
              </button>
              <ul className="dropdown-menu">
                {!comment.writer.user.is_superuser && (
                  <li>
                    <a className="dropdown-item" href={`/user/${comment.writer.user.username}`}>
                      프로필
                    </a>
                  </li>
                )}
                <li>
                  <a className="dropdown-item" onclick={`msgModalOpen(${comment.writer.user.id})`}>
                    메시지
                  </a>
                </li>
              </ul>
            </div>
          ) : (
            <div className="comment-item-writer">{comment.writer.user.username}</div>
          )}
          {request.user.id === comment.writer.user.id && (
            <div className="comment-item-delete">
              <span onclick={`comment.delete(${comment.id});`}>삭제</span>
            </div>
          )}
        </div>
        <div className="comment-item-body">{comment.body}</div>
      </div>
      <div className="comment-item-right">
        <div className="comment-item-datetime">
          <div>{pub_date1}</div>
          <div>{pub_date2}</div>
        </div>
        <div className="comment-item-mod">
          {/* {% is_comment_like comment request.user as is_comment_like %} */}
          <div className="comment-item-like" onclick={`CommentLike(${comment.id}, ${comment.writer.user.id})`}>
            {is_comment_like ? (
              <span className="material-icons">
                <FaThumbsUp />
              </span>
            ) : (
              <span className="material-icons-outlined">
                <FaRegThumbsUp />
              </span>
            )}
          </div>
          <div className="comment-item-like-cnt">{comment.like}</div>
        </div>
      </div>
    </>
  );
}

export default CommentItem;