import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsHandThumbsUp, BsBookmark, BsEye, BsChatLeftText } from 'react-icons/bs';
import ProfileDropdown_Container from '../../ProfileDropdown';

export default function UserArticle(props) {
  const { article, tabName } = props;
  const navigate = useNavigate();
  const [pubDate, setPubDate] = useState('');

  const onArticle = () => {
    navigate(`/community/article/${article.id}/`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options).replace(/\.\s/g, '.').replace(/\.$/, '');
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
      setPubDate(formatDate(article.pub_date));
    }
  }, [article]);

  return (
    <div className="board-article">
      {article.title ? (
        <>
          <div className="board-article-header">
            <div className="board-article-main" style={{ flexBasis: '50%' }}>
              <h4 className="board-article-title" onClick={onArticle}>
                {article.title}
              </h4>
              <div className="board-article-tags">
                {article.tags && article.tags.length > 0 ? (
                  <>
                    {article.tags.map((tag) => (
                      <h6 className="inline board-article-tag" key={tag.name}>
                        #{tag.name.replace(' ', '_')}&nbsp;
                      </h6>
                    ))}
                  </>
                ) : null}
              </div>
            </div>
            <div className="board-article-info" style={{ flexBasis: '50%' }}>
              <div className="board-article-writer2">
                {article.writer ? (
                  article.anonymous_writer ? (
                    <span>익명 </span>
                  ) : (
                    <ProfileDropdown_Container
                      userName={article.writer.user.username}
                      userId={article.writer.user.id}
                    />
                  )
                ) : (
                  <span>탈퇴한 이용자 </span>
                )}
              </div>
              <div className="board-article-type" onClick={onBoard}>
                {article.board.name} 게시판
              </div>
              <div style={{ flexBasis: '40%' }}>
                <div className="board-article-pubdate">{pubDate}</div>
                <div className="board-article-meta-list">
                  <BsHandThumbsUp size={12} className="board-article-meta" /> {article.like_cnt}
                  <BsChatLeftText size={12} className="board-article-meta" /> {article.comment_cnt}
                  <BsBookmark size={12} className="board-article-meta" /> {article.scrap_cnt}
                  <BsEye size={12} className="board-article-meta" /> {article.view_cnt}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : tabName === 'article' ? (
        <h5>내가 작성한 글이 없습니다.</h5>
      ) : (
        <h5>내가 스크랩한 글이 없습니다.</h5>
      )}
    </div>
  );
}
