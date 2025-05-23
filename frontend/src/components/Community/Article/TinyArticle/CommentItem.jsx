import axios from 'axios';
import axiosInstance from '../../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../../utils/auth';
import { FaRegThumbsUp, FaThumbsUp } from 'react-icons/fa';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown_Container from '../../ProfileDropdown';

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
    const response = await axiosInstance.post(like_url, {}, getAuthConfig());
    const res = response.data;
    if (!username) {
      if (window.confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      }
    } else {
      if (res.status === 'success') {
        setLikeCnt(res.data.like_cnt);
        setIsLiked(!isLiked);
      } else {
        alert(res.message);
      }
    }
  };

  const deleteComment = async () => {
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      const response = await axiosInstance.post(delete_url, {}, getAuthConfig());
      setData({ ...data, comments: response.data.data.comments });
    }
  };
  const navigate = useNavigate();
  console.log('comment.writer', comment, comment.writer);
  if (comment.writer === null) {
    comment.writer = { user: { username: '탈퇴계정', id: null } };
  }

  return (
    <div className="comment">
      <div className="comment-line1 d-flex justify-content-between align-items-end">
        <div className="comment-content d-flex align-items-center">
          {comment.anonymous_writer ? (
            <span style={{ paddingRight: '10px' }}>익명</span>
          ) : (
            <ProfileDropdown_Container userName={comment.writer.user.username} userId={comment.writer.user.id} />
          )}
          {comment.writer.user.username === username && (
            <span style={{ cursor: 'pointer', color: 'grey' }} onClick={() => deleteComment()}>
              삭제
            </span>
          )}
        </div>
        <div>
          <span className="comment-content">{pub_date1} </span>
          <span className="comment-content">{pub_date2}</span>
        </div>
      </div>
      <div className="comment-line2 d-flex justify-content-between align-items-center">
        <span className="comment-content" style={{ marginRight: '20px' }}>
          {comment.body}
        </span>
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
