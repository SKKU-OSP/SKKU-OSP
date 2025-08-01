import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import CommentItem from './CommentItem';
import axios from 'axios';
import axiosInstance from '../../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../../utils/auth';
import { useState } from 'react';
import { BsChatLeft } from 'react-icons/bs';

function Comment(props) {
  const { data, setData, username } = props;
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const server_url = import.meta.env.VITE_SERVER_URL;
  const post_url = server_url + '/community/api/comment/create/';

  const postComment = async () => {
    if (comment !== '') {
      const response = await axiosInstance.post(
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
    <div className="comment-container">
      {username && (
        <div className="comment-input">
          <div className="comment-count">
            <span className="article-info mx-1">
              <BsChatLeft size={22} style={{ margin: '3px' }} />({data.comments.length})
            </span>
          </div>

          <div className='comment-write'>
            <Form.Check
              type="checkbox"
              label="익명"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <div className="flex-grow-1 mx-1">
              <Form.Control
                type="text"
                placeholder="댓글을 입력하세요"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ backgroundColor: '#e7e7e7', borderRadius: '20px' }}
              />
            </div>
            <button className="btn-write" onClick={() => postComment()}>
              작성
            </button>
          </div>
        </div>
      )}
      {data.comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} data={data} setData={setData} username={username} />
      ))}
    </div>
  );
}

export default Comment;
