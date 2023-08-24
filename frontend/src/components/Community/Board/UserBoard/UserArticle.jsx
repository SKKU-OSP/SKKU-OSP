import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { BsHandThumbsUp, BsBookmark, BsEyeFill } from 'react-icons/bs';
import { getAuthConfig } from '../../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function UserArticle(props) {
  const { article } = props;
  const navigate = useNavigate();
  const { board_name } = useParams();
  const [pubDate, setPubDate] = useState('');
  const [userInfo, setUserInfo] = useState('');
  const [error, setError] = useState(false);

  const onArticle = () => {
    navigate(`/community/article/${article.id}/`)
  };

  const onWriter = () => {
    navigate(`/user/${article.writer.user.username}`)
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

  const getUserInfo = async () => {
    try {
      const response = await axios.get(server_url + `/user/api/info`, getAuthConfig());
      const res = response.data;
      if (res.status === 'success') {
        setUserInfo(res.data.user.username);
        console.log("info", userInfo);
      }
    } catch (error) {
      setError(true);
    }
  };

  useEffect(() => {
    getDate(article.pub_date);
    
    if (!userInfo) {
      getUserInfo();
    }
  });

  return (
    <>
      <div className="board-article">
        <h6>
          {/* {board_name === "article" ? (article.writer ? (
            <span className="board-article-writer" onClick={onWriter}>
              {article.writer.user.username}
            </span>
          ) : (
            <span>탈퇴한 이용자</span>
          )) : (article.writer ? (
            article.anonymous_writer ? (
              <span>익명</span>
            ) : (
              <span className="board-article-writer" onClick={onWriter}>
                {article.writer.user.username}
              </span>
            )
          ) : (
            <span>탈퇴한 이용자</span>
          ))} */}
          {(article.writer ? (
            article.anonymous_writer ? (
              <span>익명</span>
            ) : (
              <span className="board-article-writer" onClick={onWriter}>
                {article.writer.user.username}
              </span>
            )
          ) : (
            <span>탈퇴한 이용자</span>
          ))}
          {' '}· {pubDate}
        </h6>
        <h4 className='board-article-title' onClick={onArticle}>{article.title}</h4>
        <div>
          {article.tags && article.tags.length > 0 ? article.tags.map((tag) => (
            <h6 className="inline">#{tag.name.replace(' ', '_')}&nbsp;</h6>
          )) : <h6 className="inline">{"\u00A0"}</h6>}
          <div className="board-article-meta-list">
            <>
              <BsHandThumbsUp size={13} className="board-article-meta" /> {article.like_cnt}
            </>
            {/* <><BsFillChatLeftTextFill size={13} className='board-article-meta' /> {article.comment_cnt}</> */}
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
