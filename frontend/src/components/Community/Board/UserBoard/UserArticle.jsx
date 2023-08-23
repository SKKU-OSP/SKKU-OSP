import CommunityNavItem from '../CommunityNavItem/index';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { getAuthConfig } from '../../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;

function UserArticle() {
  const [myArticles, setMyArticles] = useState([]);
  const [error, setError] = useState(false);

  const getArticle = async () => {
    try {
      const response = await axios.get(server_url + `/community/api/user-articles/`, getAuthConfig());
      const res = response.data;
      if (res.status === 'success') {
        setMyArticles(res.data.user_articles);
        console.log("article", myArticles);
      }
    } catch (error) {
      setError(true);
    }
  };
  

  useEffect(() => {
      getArticle();
  });

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <button className="primary-btn hidden">hidden</button>
        <ul className="nav nav-fill community-nav-items">
          <CommunityNavItem this_board_name="내가 작성한 글" />
        </ul>
        <button className="primary-btn hidden">hidden</button>
      </div>

      {myArticles && myArticles.length > 0 ? (
        myArticles.map(a => (
          <TeamArticle key={a.id} article={a} />
        ))
      ) : null}

    </div>
  );
}

export default UserArticle;