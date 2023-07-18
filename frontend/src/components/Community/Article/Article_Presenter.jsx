import '../Community.css';
import './Article.css';
import SideBar from '../SideBar/index.jsx';
import Content_View from './TinyArticle/Content_View';
import Content_Edit from './TinyArticle/Content_Edit';
import Comment from './TinyArticle/Comment';
import { useEffect, useState } from 'react';
import axios from 'axios';

function Article_Presenter(props) {
  const need_login = false;
  const need_member = false;
  const type = 'view';
  const server_url = import.meta.env.VITE_SERVER_URL;
  const url = server_url + '/community/api/article/164/';
  const [article, setArticle] = useState(null);
  const [tags, setTags] = useState([]);
  const [comments, setComments] = useState([]);
  const [board, setBoard] = useState(null);
  const [error_occur, setError] = useState(false);
  useEffect(() => {
    const getArticle = async () => {
      try {
        const response = await axios.get(url).then();
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
            <div class="m-2">
              로그인이 필요한 서비스입니다. <a href="/accounts/login/">바로가기</a>
            </div>
          ) : need_member ? (
            <div class="m-2">
              팀 멤버만 열람할 수 있습니다.
              <a href={'' /*'community:Board' board_name="팀 모집" board_id=2*/}>팀 모집 게시판 확인하기</a>
            </div>
          ) : (
            <>
              <div id="article-content">
                {type === 'view' ? (
                  <Content_View board={board} tags={tags} comments={comments} article={article} />
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
