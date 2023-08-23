import styles from '../Article.module.css';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { FaRegThumbsUp, FaThumbsUp, FaBookmark, FaRegBookmark } from 'react-icons/fa';

function ContentView(props) {
  const board = props.board;
  const tags = props.tags;
  const comments = props.comments;
  const article = props.article;

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

  return (
    <div className="d-flex flex-column">
      <div className={styles.articleBar}>
        <Button variant="secondary" onClick={() => backToBoard(board.name)}>
          글 목록
        </Button>
        <span className={styles.articleBoard}> {board.name} 게시판</span>
        <Button variant="secondary" style={{ visibility: 'hidden' }}>
          글 목록
        </Button>
      </div>
      <div className={styles.articleBody}>
        <div className="d-flex justify-content-between align-items-end m-2">
          <span className={styles.articleTitle}>{article.title}</span>
          <div>
            <span className={styles.articleInfo}>
              {article.anonymous_writer ? 익명 : <>{article.writer.user.username}</>}{' '}
            </span>
            <span className={styles.articleInfo}>{pub_date1} </span>
            <span className={styles.articleInfo}>{pub_date2}</span>
          </div>
        </div>
        <div className={`m-2 ${styles.articleContent}`}>
          <span className={styles.articleInfo}>{article.body}</span>
        </div>
        <div className="m-2 d-flex gap-1">
          {tags.map((tag) => (
            <span className={`${styles.articleInfo}`} style={{ fontWeight: '600' }} key={tag.name}>
              #{tag.name}
            </span>
          ))}
        </div>
        <div className="d-flex justify-content-between m-2">
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
