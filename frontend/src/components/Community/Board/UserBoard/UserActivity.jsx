import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';
import UserArticle from './UserArticle';
import UserComment from './UserComment';
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';

const server_url = import.meta.env.VITE_SERVER_URL;

function UserActivity() {
  const { tabName } = useParams();
  const [isLoadedArticles, setIsLoadedArticles] = useState(false);
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [scraps, setScraps] = useState([]);
  const [maxArticlePage, setMaxArticlePage] = useState(0);
  const [nowArticlePage, setNowArticlePage] = useState(1);
  const [maxCommentPage, setMaxCommentPage] = useState(0);
  const [nowCommentPage, setNowCommentPage] = useState(1);
  const [maxScrapPage, setMaxScrapPage] = useState(0);
  const [nowScrapPage, setNowScrapPage] = useState(1);
  const [error, setError] = useState(false);
  const activityNames = useMemo(() => ['article', 'comment', 'scrap'], []);
  const activityNavMap = {
    article: '내가 작성한 글',
    comment: '내가 작성한 댓글',
    scrap: '내가 스크랩한 글'
  };

  const getWrittenArticle = async (page) => {
    try {
      const responseArticles = await axios.get(
        server_url + `/community/api/user-articles/?page_number=${page}`,
        getAuthConfig()
      );
      const resArticles = responseArticles.data;
      if (resArticles.status === 'success') {
        const sortedArticles = resArticles.data.user_articles.sort(
          (a, b) => new Date(b.pub_date) - new Date(a.pub_date)
        );
        setArticles(sortedArticles);
        setIsLoadedArticles(true);
        setMaxArticlePage(resArticles.data.max_page_number);
        setNowArticlePage(page);
      } else {
        alert('해당 게시판이 존재하지 않습니다.');
      }
    } catch (error) {
      setError(true);
    }
  };

  const getWrittenComment = async (page) => {
    try {
      const responseComments = await axios.get(
        server_url + `/community/api/user-comments/?page_number=${page}`,
        getAuthConfig()
      );
      const resComments = responseComments.data;

      if (resComments.status === 'success') {
        const sortedComments = resComments.data.articlecomments.sort(
          (a, b) => new Date(b.pub_date) - new Date(a.pub_date)
        );
        setComments(sortedComments);
        console.log('hi', sortedComments);
        setIsLoadedArticles(true);
        setMaxCommentPage(resComments.data.max_page_number);
        setNowCommentPage(page);
      } else {
        alert('해당 게시판이 존재하지 않습니다.');
      }
    } catch (error) {
      setError(true);
    }
  };

  const getScrapArticle = async (page) => {
    try {
      const responseScraps = await axios.get(
        server_url + `/community/api/user-scrap-articles/?page_number=${page}`,
        getAuthConfig()
      );
      const resScraps = responseScraps.data;
      if (resScraps.status === 'success') {
        const sortedScraps = resScraps.data.userscraparticles.sort(
          (a, b) => new Date(b.pub_date) - new Date(a.pub_date)
        );
        setScraps(sortedScraps);
        setIsLoadedArticles(true);
        setMaxScrapPage(resScraps.data.max_page_number);
        setNowScrapPage(page);
      } else {
        alert('해당 게시판이 존재하지 않습니다.');
      }
    } catch (error) {
      setError(true);
    }
  };

  useEffect(() => {
    setIsLoadedArticles(false);
    // 존재하는 게시판인지 확인
    if (!activityNames.includes(tabName)) {
      alert('존재하지 않는 게시판입니다.');
    } else {
      if (tabName === 'article') {
        getWrittenArticle(1);
      } else if (tabName === 'comment') {
        getWrittenComment(1);
      } else if (tabName === 'scrap') {
        getScrapArticle(1);
      }
    }
  }, [tabName, activityNames]);

  const onWrittenArticleChange = (page) => {
    if (tabName === 'article') {
      getWrittenArticle(page);
    }
  };

  const onCommentChange = (page) => {
    if (tabName === 'comment') {
      getWrittenComment(page);
    }
  };

  const onScrapChange = (page) => {
    if (tabName === 'scrap') {
      getScrapArticle(page);
    }
  };

  return (
    <div className="col-9">
      <div className="community-team-nav d-flex">
        <div></div>
        <div className="nav nav-fill community-team-nav-items">
          {activityNames.includes(tabName) && (
            <li className="community-team-nav-items">
              <div>{activityNavMap[tabName]}</div>
            </li>
          )}
        </div>
        <div></div>
      </div>

      {isLoadedArticles ? (
        <>
          {tabName === 'article' && articles && articles.length > 0 ? (
            <>
              {articles.map((a) => (
                <UserArticle key={a.id} article={a} />
              ))}
              <Pagination
                activePage={nowArticlePage}
                itemsCountPerPage={10}
                totalItemsCount={maxArticlePage * 10}
                pageRangeDisplayed={5}
                onChange={onWrittenArticleChange}
              />
            </>
          ) : null}
          {tabName === 'comment' && comments && comments.length > 0 ? (
            <>
              {comments.map((c) => (
                <UserComment key={c.id} comment={c} />
              ))}
              <Pagination
                activePage={nowCommentPage}
                itemsCountPerPage={10}
                totalItemsCount={maxCommentPage * 10}
                pageRangeDisplayed={5}
                onChange={onCommentChange}
              />
            </>
          ) : null}
          {tabName === 'scrap' && scraps && scraps.length > 0 ? (
            <>
              {scraps.map((a) => (
                <UserArticle key={a.id} article={a} />
              ))}
              <Pagination
                activePage={nowScrapPage}
                itemsCountPerPage={10}
                totalItemsCount={maxScrapPage * 10}
                pageRangeDisplayed={5}
                onChange={onScrapChange}
              />
            </>
          ) : null}
        </>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </div>
  );
}

export default UserActivity;
