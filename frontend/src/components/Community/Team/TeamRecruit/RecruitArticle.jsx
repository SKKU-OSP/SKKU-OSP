import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../../../utils/auth-context';
import ProfileDropdown_Container from '../../ProfileDropdown';

export default function RecruitArticle(props) {
  const { article } = props;
  const [pubDate, setPubDate] = useState('');
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

  const getDate = (date) => {
    if (!date) return;
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
  }, [article]);

  return (
    <div className="board-article">
      {article.title ? (
        <>
          <div>
            {article.writer ? (
              article.anonymous_writer ? (
                <span>익명 </span>
              ) : (
                <ProfileDropdown_Container userName={article.writer.user.username} userId={article.writer.user.id} />
              )
            ) : (
              <span>탈퇴한 이용자 </span>
            )}
            · {pubDate}
          </div>
          <h4 className="board-article-title" onClick={onArticle}>
            [{article.team_name ? article.team_name : null}]&nbsp;{article.title}
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
              {article?.period_end && new Date(article.period_end) > new Date() ? (
                <span className="text-primary">모집중</span>
              ) : (
                <span>모집 마감</span>
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
