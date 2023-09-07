import styles from '../Article.module.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import CommentItem from './CommentItem';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';
import { useState } from 'react';

function Comment(props) {
  const { data, setData, username } = props;
  console.log('Comment data', data);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const server_url = import.meta.env.VITE_SERVER_URL;
  const post_url = server_url + '/community/api/comment/create/';

  const postComment = async () => {
    if (comment !== '') {
      const response = await axios.post(
        post_url,
        { article_id: data.article.id, content: comment, anonymous_writer: isAnonymous },
        getAuthConfig()
      );
      setData({ ...data, comments: [...data.comments, response.data.data.comment] });
      setComment('');
      setIsAnonymous(false);
    } else {
      alert('댓글을 입력하세요');
    }
  };

  return (
    <div className={styles.commentContainer}>
      <div className={`${styles.commentInput} d-flex align-items-center justify-content-between`}>
        <Form.Check
          type="checkbox"
          label="익명"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />
        <div className="col-10">
          <Form.Control
            type="text"
            placeholder="댓글을 입력하세요"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={() => postComment()}>
          댓글 쓰기
        </Button>
      </div>
      {data.comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} data={data} setData={setData} username={username} />
      ))}
    </div>
  );
}

export default Comment;
