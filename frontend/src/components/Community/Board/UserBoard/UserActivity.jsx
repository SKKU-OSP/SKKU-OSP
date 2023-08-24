import CommunityNavItem from '../../Board/CommunityNavItem/index';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuthConfig } from '../../../../utils/auth';
import UserArticle from './UserArticle';

const server_url = import.meta.env.VITE_SERVER_URL;

function UserActivity() {
  const navigate = useNavigate();
  const { activity_name } = useParams();
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [scraps, setScraps] = useState([]);
  const [error, setError] = useState(false);
  const activity_names = ['article', 'comment', 'scrap'];

  console.log()

  const getArticle = async () => {
    try {
      const responseArticles = await axios.get(server_url + `/community/api/user-articles/`, getAuthConfig());
      const responseComments = await axios.get(server_url + `/community/api/user-comments/`, getAuthConfig());
      const responseScraps = await axios.get(server_url + `/community/api/user-scrap-articles/`, getAuthConfig());
      const resArticles = responseArticles.data;
      const resComments = responseComments.data;
      const resScraps = responseScraps.data;
      if (resArticles.status === 'success') {
        const sortedArticles = resArticles.data.user_articles.sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date));
        setArticles(sortedArticles);
      }
      if (resComments.status === 'success') {
        setComments(resComments.data.artclecomments);
      }
      if (resScraps.status === 'success') {
        const sortedScraps = resScraps.data.userscraparticles.sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date));
        setScraps(sortedScraps);
      }
    } catch (error) {
      setError(true);
    }
  };

  useEffect(() => {
    // 존재하는 게시판인지 확인
    if (!activity_names.includes(activity_name)) {
      alert('존재하지 않는 게시판입니다.');
      navigate('/community/activity/article/');
    } else{
      getArticle();
    }
  });

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <button className="primary-btn hidden">hidden</button>
        {activity_name === "article" && (
          <>
            <div className="nav nav-fill community-nav-items">
              <CommunityNavItem this_activity_name="article" />
            </div>
            <button className="primary-btn hidden">hidden</button>
          </>
        )}
        {activity_name === "comment" && (
          <>
            <div className="nav nav-fill community-nav-items">
              <CommunityNavItem this_activity_name="comment" />
            </div>
            <button className="primary-btn hidden">hidden</button>
          </>
        )}
        {activity_name === "scrap" && (
          <>
            <div className="nav nav-fill community-nav-items">
              <CommunityNavItem this_activity_name="scrap" />
            </div>
            <button className="primary-btn hidden">hidden</button>
          </>
        )}
      </div>

      {activity_name === "article" && articles && articles.length > 0 ? (
        articles.map(a => (
          <UserArticle key={a.id} article={a} />
        ))
      ) : null}
      {activity_name === "comment" && comments && comments.length > 0 ? (
        comments.map(a => (
          <UserArticle key={a.id} article={a} />
        ))
      ) : null}
      {activity_name === "scrap" && scraps && scraps.length > 0 ? (
        scraps.map(a => (
          <UserArticle key={a.id} article={a} />
        ))
      ) : null}
    </div>
  );
}

export default UserActivity;