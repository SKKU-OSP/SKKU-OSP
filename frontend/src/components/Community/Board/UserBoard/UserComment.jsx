import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsHandThumbsUp } from 'react-icons/bs';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

export default function UserComment(props) {
  const { comment } = props;
  const navigate = useNavigate();
  const [pubDate, setPubDate] = useState('');

  const onArticle = () => {
    navigate(`/community/article/${comment.article.id}/`);
  };

  const onWriter = () => {
    navigate(`/user/${comment.writer.user.username}`);
  };

  const getDate = (date) => {
    const now = new Date();
    const comment_date = new Date(date);
    const delta = now.getTime() - comment_date.getTime();

    if (delta / (60 * 1000) < 1) {
      setPubDate('방금');
    } else if (delta / (60 * 1000) < 60) {
      setPubDate((delta / (60 * 1000)).toFixed() + '분 전');
    } else if (delta / (60 * 60 * 1000) < 24) {
      setPubDate((delta / (60 * 60 * 1000)).toFixed() + '시간 전');
    } else if (delta / (24 * 60 * 60 * 1000) < 31) {
      setPubDate((delta / (24 * 60 * 60 * 1000)).toFixed() + '일 전');
    } else {
      setPubDate(date.substring(0, 10));
    }
  };

  const onBoard = () => {
    if (comment.board.board_type === 'Team') {
      navigate(`/community/team/${comment.board.name}`);
    } else if (comment.board.board_type === 'General') {
      navigate(`/community/board/${comment.board.name}`);
    }
  };

  useEffect(() => {
    if (comment?.pub_date) {
      getDate(comment.pub_date);
    }
  }, [comment]);

  return (
    <div className="board-article">
      <>
        <h6>
          {comment.writer ? (
            comment.anonymous_writer ? (
              <span>익명</span>
            ) : (
              <span className="dropdown-button">
                <DropdownButton
                  title={comment.writer.user.username}
                  variant="link"
                  className="dropdown-toggle"
                  style={{ marginRight: '5px' }}
                >
                  <Dropdown.Item onClick={onWriter}>프로필</Dropdown.Item>
                </DropdownButton>
              </span>
            )
          ) : (
            <span>탈퇴한 이용자</span>
          )}
          · {pubDate}
          <div className="board-article-meta-type" onClick={onBoard}>
            {comment.board.name} 게시판
          </div>
        </h6>
        <h4 className="board-article-title" onClick={onArticle}>
          {comment.body}
        </h4>
        <h6 style={{ color: 'gray' }}>{comment.article.title}</h6>
        <div>
          {comment.article.title.length > 40 ? (
            <h6 className="inline">{`${comment.article.title.substring(0, 40)}...`}</h6>
          ) : (
            <h6 className="inline">{`${comment.article.title}`}</h6>
          )}
          <div className="board-article-meta-list">
            <>
              <BsHandThumbsUp size={13} className="board-article-meta" /> {comment.like_cnt}
            </>
          </div>
        </div>
      </>
    </div>
  );
}
