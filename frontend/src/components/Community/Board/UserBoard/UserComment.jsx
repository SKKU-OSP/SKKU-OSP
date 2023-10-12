import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsHandThumbsUp } from 'react-icons/bs';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

export default function UserComment(props) {
  const { article } = props;
  const navigate = useNavigate();
  const [pubDate, setPubDate] = useState('');

  const onArticle = () => {
    navigate(`/community/article/${article.article_id}/`);
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

  useEffect(() => {
    if (article?.pub_date) {
      getDate(article.pub_date);
    }
    if (!article.body) {
      console.log(article);
    }
  }, [article]);

  return (
    <>
      {article.body && (
        <div className="board-article">
          <>
            <h6>
              {article.writer ? (
                article.anonymous_writer ? (
                  <span>익명</span>
                ) : (
                  <span className="dropdown-button">
                    <DropdownButton title={article.writer.user.username} variant="link" className="dropdown-toggle">
                      <Dropdown.Item onClick={onWriter}>프로필</Dropdown.Item>
                    </DropdownButton>
                  </span>
                )
              ) : (
                <span>탈퇴한 이용자</span>
              )}
              · {pubDate}
              <div
                className="board-article-meta-type"
                onClick={() => {
                  navigate(`/community/board/${article.board.name}`);
                }}
              >
                {article.board.name} 게시판
              </div>
            </h6>
            <h4 className="board-article-title" onClick={onArticle}>
              {article.body}
            </h4>
            <div>
              <h6 className="inline">{'\u00A0'}</h6>
              <div className="board-article-meta-list">
                <>
                  <BsHandThumbsUp size={13} className="board-article-meta" /> {article.like_cnt}
                </>
              </div>
            </div>
          </>
        </div>
      )}
    </>
  );
}
