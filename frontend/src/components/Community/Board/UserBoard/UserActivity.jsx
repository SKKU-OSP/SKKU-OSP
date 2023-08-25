import CommunityNavItem from '../../Board/CommunityNavItem/index';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuthConfig } from '../../../../utils/auth';
import UserArticle from './UserArticle';

const server_url = import.meta.env.VITE_SERVER_URL;

function UserActivity() {
  const { activity_name } = useParams();
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [scraps, setScraps] = useState([]);
  const [error, setError] = useState(false);
  const activityNames = useMemo(() => ['article', 'comment', 'scrap'], []);

  useEffect(() => {
    const getWrittenArticle = async () => {
      try {
        const responseArticles = await axios.get(server_url + `/community/api/user-articles/`, getAuthConfig());
        const resArticles = responseArticles.data;
        if (resArticles.status === 'success') {
          const sortedArticles = resArticles.data.user_articles.sort(
            (a, b) => new Date(b.pub_date) - new Date(a.pub_date)
          );
          setArticles(sortedArticles);
        }
      } catch (error) {
        setError(true);
      }
    };
    const getWrittenComment = async () => {
      try {
        const responseComments = await axios.get(server_url + `/community/api/user-comments/`, getAuthConfig());
        const resComments = responseComments.data;
        if (resComments.status === 'success') {
          setComments(resComments.data.artclecomments);
        }
      } catch (error) {
        setError(true);
      }
    };
    const getScrapArticle = async () => {
      try {
        const responseScraps = await axios.get(server_url + `/community/api/user-scrap-articles/`, getAuthConfig());
        const resScraps = responseScraps.data;
        if (resScraps.status === 'success') {
          const sortedScraps = resScraps.data.userscraparticles.sort(
            (a, b) => new Date(b.pub_date) - new Date(a.pub_date)
          );
          setScraps(sortedScraps);
        }
      } catch (error) {
        setError(true);
      }
    };
    // 존재하는 게시판인지 확인
    if (!activityNames.includes(activity_name)) {
      alert('존재하지 않는 게시판입니다.');
    } else {
      if (activity_name === 'article') {
        getWrittenArticle();
      } else if (activity_name === 'comment') {
        getWrittenComment();
      } else if (activity_name === 'scrap') {
        getScrapArticle();
      }
    }
  }, [activity_name, activityNames]);

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <button className="primary-btn hidden">hidden</button>
        <div className="nav nav-fill community-nav-items">
          {activityNames.includes(activity_name) && <CommunityNavItem this_activity_name={activity_name} />}
        </div>
        <button className="primary-btn hidden">hidden</button>
      </div>

      {activity_name === 'article' && articles && articles.length > 0
        ? articles.map((a) => <UserArticle key={a.id} article={a} />)
        : null}
      {activity_name === 'comment' && comments && comments.length > 0
        ? comments.map((a) => <UserArticle key={a.id} article={a} />)
        : null}
      {activity_name === 'scrap' && scraps && scraps.length > 0
        ? scraps.map((a) => <UserArticle key={a.id} article={a} />)
        : null}
    </div>
  );
}

export default UserActivity;
