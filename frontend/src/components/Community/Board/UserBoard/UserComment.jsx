import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsHandThumbsUp } from 'react-icons/bs';
import ProfileDropdown_Container from '../../ProfileDropdown';

export default function UserComment(props) {
  const { comment } = props;
  const navigate = useNavigate();
  const [pubDate, setPubDate] = useState('');

  const onArticle = () => {
    navigate(`/community/article/${comment.article.id}/`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options).replace(/\.\s/g, '.').replace(/\.$/, '');
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
      setPubDate(formatDate(comment.pub_date));
    }
  }, [comment]);

  return (
    <div className="board-article">
      {comment.body ? (
        <>
          <div className="board-article-header">
            <div className="board-article-main" style={{ flexBasis: '55%' }}>
              <h4 className="board-article-title" onClick={onArticle}>
                {comment.body}
              </h4>
              <div className="board-article-tags">
                <h6 className="board-sub-title">{`${comment.article.title}`}</h6>
              </div>
            </div>
            <div className="board-article-info" style={{ flexBasis: '45%' }}>
              <div className="board-article-writer2" style={{ flexBasis: '40%' }}>
                {comment.writer ? (
                  comment.anonymous_writer ? (
                    <span>익명</span>
                  ) : (
                    <ProfileDropdown_Container
                      userName={comment.writer.user.username}
                      userId={comment.writer.user.id}
                    />
                  )
                ) : (
                  <span>탈퇴한 이용자 </span>
                )}
              </div>
              <div className="board-article-type" style={{ flexBasis: '30%' }} onClick={onBoard}>
                {comment.board.name} 게시판
              </div>
              <div style={{ flexBasis: '30%' }}>
                <div className="board-article-pubdate">{pubDate}</div>
                <div className="board-article-meta-list">
                  <BsHandThumbsUp size={12} className="board-article-meta" /> {comment.like_cnt}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <h5>내가 작성한 댓글이 없습니다.</h5>
      )}
    </div>
  );
}
