import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../../../utils/auth-context';
import { BsHandThumbsUp, BsChatLeftText, BsBookmark, BsEye } from 'react-icons/bs';
import ProfileDropdown_Container from '../../ProfileDropdown';

export default function RecruitArticle(props) {
  const { article, pubDate } = props;
  const navigate = useNavigate();
  const { username } = useContext(AuthContext);

  const onArticle = () => {
    navigate(`/community/article/${article.id}/`);
  };

  const onWriter = () => {
    if (username) {
      navigate(`/user/${article.writer.user.username}`);
    } else {
      if (confirm('로그인이 필요합니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate(`/accounts/login`);
      }
    }
  };

  return (
    <div className="board-article">
      {article.title ? (
        <>
          <div className="board-article-header">
            <div className="board-team">
              {article.team_name ? (
                <>
                  <h5 className="board-team-name">{article.team_name}</h5>
                  <div className="vertical-divider"></div>
                  <h4 className="board-team-title" onClick={onArticle}>
                    {article.title}
                  </h4>
                </>
              ) : (
                <>
                  <h5 className="board-team-name hidden-placeholder">No name</h5>
                  <div className="vertical-divider"></div>
                  <h4 className="board-team-title" onClick={onArticle}>
                    {article.title}
                  </h4>
                </>
              )}
            </div>
            <div className="board-article-info">
              <div className="board-article-writer">
                {article.writer ? (
                  article.anonymous_writer ? (
                    <span>익명</span>
                  ) : (
                    <ProfileDropdown_Container
                      userName={article.writer.user.username}
                      userId={article.writer.user.id}
                    />
                  )
                ) : (
                  <span>탈퇴한 이용자</span>
                )}
              </div>
              <div className="board-article-list">
                <div className="board-article-pubdate">{pubDate}</div>
                <div className="board-article-meta-list">
                  <BsHandThumbsUp size={13} className="board-article-meta" /> {article.like_cnt}
                  <BsChatLeftText size={13} className="board-article-meta" /> {article.comment_cnt}
                  <BsBookmark size={13} className="board-article-meta" /> {article.scrap_cnt}
                  <BsEye size={13} className="board-article-meta" /> {article.view_cnt}
                </div>
              </div>
            </div>
            <div className="board-team-recruit">
              {article?.period_end && new Date(article.period_end) > new Date() ? (
                <span className="board-team-recruit-on">모집중</span>
              ) : (
                <span className="board-team-recruit-off">모집마감</span>
              )}
            </div>
          </div>
        </>
      ) : (
        <h5>작성된 글이 없습니다.</h5>
      )}
    </div>
  );
}
