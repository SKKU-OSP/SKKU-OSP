import Search_Presenter from './Search_Presenter';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';
import Spinner from 'react-bootstrap/Spinner';

function Search_Container() {
  const [articles, setArticles] = useState();
  const [keyword, setKeyword] = useState();
  const [error_occur, setError] = useState(false);
  const server_url = import.meta.env.VITE_SERVER_URL;
  const searchUrl = server_url + '/community/search';
  const location = useLocation();

  useEffect(() => {
    const getSearch = async () => {
      try {
        setKeyword(location.state?.keyword);
        const response = await axios.get(searchUrl, {
          ...getAuthConfig(),
          params: {
            keyword: location.state?.keyword
          }
        });
        const res = response.data;
        if (res.status === 'success') {
          console.log('Article', res.data.articles);
          setArticles(res.data.articles);
        }
      } catch (error) {
        setError(true);
      }
    };
    getSearch();
  }, [location]);
  return (
    <>
      {articles && keyword ? (
        <Search_Presenter articles={articles} keyword={keyword} />
      ) : (
        <Spinner animation="border" style={{ position: 'absolute', top: '50%', left: '50%' }} />
      )}
    </>
  );
}
export default Search_Container;
