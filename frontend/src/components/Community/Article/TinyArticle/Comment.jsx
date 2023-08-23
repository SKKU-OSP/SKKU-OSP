import styles from '../Article.module.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import CommentItem from './CommentItem';

function Comment(props) {
  const comments = props.comments;
  const article = props.article;
  return (
    <div className={styles.commentContainer}>
      <div className="d-flex align-items-center m-2 gap-2">
        <Form.Control size="lg" type="text" placeholder="댓글을 입력하세요" />
        <Button variant="secondary" onClick={() => backToBoard(board.name)}>
          +
        </Button>
      </div>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

export default Comment;
