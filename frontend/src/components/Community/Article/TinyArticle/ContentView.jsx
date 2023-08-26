import styles from '../Article.module.css';
import Button from 'react-bootstrap/Button';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRegThumbsUp, FaThumbsUp, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import axios from 'axios';
import AuthContext from '../../../../utils/auth-context';
import { getAuthConfig } from '../../../../utils/auth';

function ContentView(props) {
  const { board, tags, comments, article } = props;
  const { username } = useContext(AuthContext);

  const domain_url = import.meta.env.VITE_SERVER_URL;
  const delete_url = `${domain_url}/community/api/article/${article.id}/delete/`;

  const dateObject = new Date(article.pub_date);
  const pub_date1 = dateObject.toISOString().slice(0, 10);
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const period = hours >= 12 ? 'p.m.' : 'a.m.';
  const pub_date2 = `${hours}:${minutes.toString().padStart(2, '0')}`;

  const navigate = useNavigate();

  const backToBoard = (boardname) => {
    navigate('/community/board/' + boardname);
  };

  const onEdit = () => {
    navigate(`/community/article/${article.id}/edit`);
  };

  const onDelete = async () => {
    if (confirm('게시글을 삭제하시겠습니까?')) {
      try {
        const response = await axios.post(delete_url, { article_id: article.id }, getAuthConfig());
        const res = response.data;
        if (res.status === 'fail') {
          console.log(res.errors);
        } else {
          backToBoard(board.name);
        }
      } catch (error) {
        console.log('error', error);
      }
    }
  };

  return (
    <div className="d-flex flex-column">
      <div className={styles.articleBar}>
        <Button
          variant="secondary"
          style={{ width: '80px', marginRight: '50px' }}
          onClick={() => backToBoard(board.name)}
        >
          글 목록
        </Button>
        <span className={styles.articleBoard}> {board.name} 게시판</span>
        {username === article.writer.user.username ? (
          <div>
            <Button variant="outline-primary" style={{ width: '60px', marginRight: '10px' }} onClick={onEdit}>
              수정
            </Button>
            <Button variant="outline-secondary" style={{ width: '60px' }} onClick={onDelete}>
              삭제
            </Button>
          </div>
        ) : (
          <Button variant="secondary" style={{ width: '80px', marginRight: '50px', visibility: 'hidden' }}>
            글 목록
          </Button>
        )}
      </div>
      <div className={styles.articleBody}>
        <div className="d-flex justify-content-between align-items-end">
          <span className={styles.articleTitle}>{article.title}</span>
          <div>
            <span className={styles.articleInfo}>
              {article.anonymous_writer ? '익명' : <>{article.writer.user.username}</>}
              {' · '}
            </span>
            <span className={styles.articleInfo}>{pub_date1} </span>
            <span className={styles.articleInfo}>{pub_date2}</span>
          </div>
        </div>
        <div className={`${styles.articleContent}`}>
          <span dangerouslySetInnerHTML={{ __html: article.body }} className={styles.articleInfo}></span>
        </div>
        <div className="d-flex gap-1">
          {tags.map((tag) => (
            <span className={`${styles.articleInfo}`} style={{ fontWeight: '600' }} key={tag.name}>
              #{tag.name}
            </span>
          ))}
        </div>
        <div className="d-flex justify-content-between">
          <div>
            <span className={styles.articleInfo}>조회수 {article.view_cnt} </span>
            <span className={styles.articleInfo}>댓글 {comments.length}</span>
          </div>
          <div>
            <div className="d-flex align-items-center gap-1">
              <FaRegThumbsUp />
              <span className={styles.articleInfo}>{article.like_cnt} </span>
              <FaRegBookmark />
              <span className={styles.articleInfo}>{article.scrap_cnt}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentView;
