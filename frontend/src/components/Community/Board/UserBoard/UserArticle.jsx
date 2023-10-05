import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsHandThumbsUp, BsBookmark, BsEyeFill } from 'react-icons/bs';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

export default function UserArticle(props) {
  const { article } = props;
  const navigate = useNavigate();
  const [pubDate, setPubDate] = useState('');

  const onArticle = () => {
    navigate(`/community/article/${article.id}/`);
  };

  const onWriter = () => {
    navigate(`/user/${article.writer.user.username}`);
  };

  const getDate = (date) => {
    const now = new Date();
    const article_date = new Date(date);
    const delta = now.getTime() - article_date.getTime();

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
    if (article.board.board_type === 'Team') {
      navigate(`/community/team/${article.board.name}`);
    } else if (article.board.board_type === 'General') {
      navigate(`/community/board/${article.board.name}`);
    }
  };

  useEffect(() => {
    if (article?.pub_date) {
      getDate(article.pub_date);
    }
  }, [article]);

  return (
    <>
      <div className="board-article">
        <h6>
          {article.writer ? (
            article.anonymous_writer ? (
              <span>익명 </span>
            ) : (
              <span className="dropdown-button">
                <DropdownButton title={article.writer.user.username} variant="link" className="dropdown-toggle">
                  <Dropdown.Item onClick={onWriter}>프로필</Dropdown.Item>
                  <Dropdown.Item>메세지</Dropdown.Item>
                </DropdownButton>
              </span>
            )
          ) : (
            <span>탈퇴한 이용자 </span>
          )}
          · {pubDate}
          <div className="board-article-meta-type" onClick={onBoard}>
            {article.board.name} 게시판
          </div>
        </h6>
        <h4 className="board-article-title" onClick={onArticle}>
          {article.title}
        </h4>
        <div>
          {article.tags && article.tags.length > 0 ? (
            article.tags.map((tag) => (
              <h6 className="inline" key={tag.name}>
                #{tag.name.replace(' ', '_')}&nbsp;
              </h6>
            ))
          ) : (
            <h6 className="inline">{'\u00A0'}</h6>
          )}
          <div className="board-article-meta-list">
            <>
              <BsHandThumbsUp size={13} className="board-article-meta" /> {article.like_cnt}
            </>
            <>
              <BsBookmark size={13} className="board-article-meta" /> {article.scrap_cnt}
            </>
            <>
              <BsEyeFill size={13} className="board-article-meta" /> {article.view_cnt}
            </>
          </div>
        </div>
      </div>
    </>
  );
}
