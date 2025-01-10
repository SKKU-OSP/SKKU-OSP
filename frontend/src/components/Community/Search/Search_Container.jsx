import Search_Presenter from './Search_Presenter';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../../../utils/axiosInterCeptor';
import { getAuthConfig } from '../../../utils/auth';
import LoaderIcon from 'react-loader-icon';

const server_url = import.meta.env.VITE_SERVER_URL;

function Search_Container() {
  const [articles, setArticles] = useState();
  const [keyword, setKeyword] = useState();
  const [tag, setTag] = useState();
  const searchUrl = server_url + '/community/search/';
  const location = useLocation();

  useEffect(() => {
    const getSearch = async () => {
      try {
        setKeyword(location.state?.keyword);
        setTag(location.state?.tag);
        const response = await axiosInstance.get(searchUrl, {
          ...getAuthConfig(),
          params: {
            keyword: location.state?.keyword,
            tag: location.state?.tag
          }
        });
        const res = response.data;
        if (res.status === 'success') {
          setArticles(res.data.articles);
        }
      } catch (error) {}
    };
    getSearch();
  }, [location]);
  return (
    <>
      {articles && (keyword || tag) ? (
        <Search_Presenter articles={articles} keyword={keyword} tag={tag} />
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}
export default Search_Container;
