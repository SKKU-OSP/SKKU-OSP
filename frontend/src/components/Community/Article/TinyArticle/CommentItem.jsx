import styles from '../Article.module.css';
import axios from 'axios';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { getAuthConfig } from '../../../../utils/auth';
import { FaRegThumbsUp, FaThumbsUp } from 'react-icons/fa';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CommentItem(props) {
  const { comment, data, setData, username } = props;
  const [isLiked, setIsLiked] = useState(comment.marked_like);
  const [likeCnt, setLikeCnt] = useState(comment.like_cnt);
  const dateObject = new Date(comment.pub_date);
  const pub_date1 = dateObject.toISOString().slice(0, 10);
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const pub_date2 = `${hours}:${minutes.toString().padStart(2, '0')}`;

  const server_url = import.meta.env.VITE_SERVER_URL;
  const like_url = server_url + `/community/api/comment/${comment.id}/like/`;
  const delete_url = server_url + `/community/api/comment/${comment.id}/delete/`;

  const likeComment = async () => {
    const response = await axios.post(like_url, {}, getAuthConfig());
    const res = response.data;
    if (res.status === 'success') {
      setLikeCnt(res.data.like_cnt);
      setIsLiked(!isLiked);
    }
  };

  const deleteComment = async () => {
    const response = await axios.post(delete_url, {}, getAuthConfig());
    setData({ ...data, comments: response.data.data.comments });
  };
  const navigate = useNavigate();
  const onMyProfile = (username) => {
    navigate('/user/' + username);
  };

  return (
    <div className={styles.comment}>
      <div className="d-flex justify-content-between align-items-end m-2">
        <span className={`${styles.commentContent} d-flex align-items-center`}>
          {comment.anonymous_writer ? (
            <>익명</>
          ) : (
            <div>
              <DropdownButton
                title={comment.writer.user.username}
                variant="link"
                style={{ marginTop: '10px', textDecoration: 'none' }}
              >
                <Dropdown.Item onClick={() => onMyProfile(comment.writer.user.username)}>프로필</Dropdown.Item>
                <Dropdown.Item>메세지</Dropdown.Item>
              </DropdownButton>
            </div>
          )}{' '}
          {comment.writer.user.username === username && (
            <span style={{ cursor: 'pointer' }} onClick={() => deleteComment()}>
              삭제
            </span>
          )}
        </span>
        <div>
          <span className={styles.commentContent}>{pub_date1} </span>
          <span className={styles.commentContent}>{pub_date2}</span>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center m-2">
        <span className={styles.commentContent}>{comment.body} </span>
        <div className="d-flex align-items-center gap-1">
          {isLiked ? (
            <FaThumbsUp onClick={() => likeComment()} style={{ cursor: 'pointer' }} />
          ) : (
            <FaRegThumbsUp onClick={() => likeComment()} style={{ cursor: 'pointer' }} />
          )}
          <span>{likeCnt}</span>
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
