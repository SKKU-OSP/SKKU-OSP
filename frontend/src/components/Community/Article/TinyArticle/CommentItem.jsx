import styles from '../Article.module.css';
import { FaRegThumbsUp, FaThumbsUp } from 'react-icons/fa';

function CommentItem(props) {
  const comment = props.comment;
  const dateObject = new Date(comment.pub_date);
  const pub_date1 = dateObject.toISOString().slice(0, 10);
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const period = hours >= 12 ? 'p.m.' : 'a.m.';
  const pub_date2 = `${hours}:${minutes.toString().padStart(2, '0')} `;
  // 날짜 표현

  return (
    <div className={styles.comment}>
      <div className="d-flex justify-content-between align-items-end m-2">
        <span className={styles.commentContent}>
          {comment.anonymous_writer ? <>익명</> : <>{comment.writer.user.username}</>}{' '}
        </span>
        <div>
          <span className={styles.commentContent}>{pub_date1} </span>
          <span className={styles.commentContent}>{pub_date2}</span>
        </div>
      </div>
      <div className="m-2">
        <span className={styles.commentContent}>{comment.body} </span>
      </div>
    </div>
  );
}

export default CommentItem;
