import Article_Presenter from './Article_Presenter';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';
import Spinner from 'react-bootstrap/Spinner';

function Article_Container() {
  const [article, setArticle] = useState();
  const [tags, setTags] = useState([]);
  const [comments, setComments] = useState([]);
  const [board, setBoard] = useState();
  const [error_occur, setError] = useState(false);
  const { article_id } = useParams();

  useEffect(() => {
    const getArticle = async () => {
      try {
        const server_url = import.meta.env.VITE_SERVER_URL;
        const url = server_url + '/community/api/article/' + article_id;
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        console.log(res);
        if (res.status === 'success') {
          console.log('GET', res.data, res.message);
          setArticle(res.data.article);
          setTags(res.data.tags);
          setComments(res.data.comments);
          setBoard(res.data.board);
        }
      } catch (error) {
        console.log(error);
        setError(true);
      }
    };
    getArticle();
  }, [article_id]);

  return (
    <>
      {article && board ? (
        error_occur ? (
          <>잘못된 페이지입니다.</>
        ) : (
          <Article_Presenter article={article} tags={tags} comments={comments} board={board} />
        )
      ) : (
        <Spinner animation="border" style={{ position: 'absolute', top: '50%', left: '50%' }} />
      )}
    </>
  );
}
export default Article_Container;
