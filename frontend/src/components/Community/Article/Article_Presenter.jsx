import '../Community.css';
import './Article.css';
import ContentView from './TinyArticle/ContentView';
import ContentEdit from './TinyArticle/ContentEdit';
import Comment from './TinyArticle/Comment';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../../utils/auth-context';
import { useContext } from 'react';
import { getAuthConfig } from '../../../utils/auth';

function Article_Presenter() {
  const need_login = false;
  const need_member = false;
  const type = 'view';
  // 아직 API로 필요한 것들

  const [article, setArticle] = useState(null);
  const [tags, setTags] = useState([]);
  const [comments, setComments] = useState([]);
  const [board, setBoard] = useState(null);
  const [error_occur, setError] = useState(false);
  const authCtx = useContext(AuthContext);
  const { article_id } = useParams();

  const server_url = import.meta.env.VITE_SERVER_URL;
  const url = server_url + '/community/api/article/' + article_id;

  useEffect(() => {
    const getArticle = async () => {
      try {
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setArticle(res.data.article);
          setTags(res.data.tags);
          setComments(res.data.comments);
          setBoard(res.data.board);
        }
      } catch (error) {
        setError(true);
      }
    };
    getArticle();
  }, []);

  return (
    <>
      {error_occur ? (
        <>잘못된 페이지 입니다.</>
      ) : (
        <div id="community-main" className="col-md-9">
          {need_login ? (
            <div className="m-2">
              로그인이 필요한 서비스입니다. <a href="/accounts/login/">바로가기</a>
            </div>
          ) : need_member ? (
            <div className="m-2">
              팀 멤버만 열람할 수 있습니다.
              <a href={`/community/board/팀 모집/2`}>팀 모집 게시판 확인하기</a>
            </div>
          ) : (
            <>
              <div id="article-content">
                {type === 'view' ? (
                  <ContentView board={board} tags={tags} comments={comments} article={article} />
                ) : (
                  <>{/* <Content_Edit /> */}</>
                )}
              </div>
              <div id="comment-content">{type !== 'register' && <Comment comments={comments} article={article} />}</div>
            </>
          )}
        </div>
      )}
    </>
  );
}
export default Article_Presenter;
