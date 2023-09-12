import styles from '../Article.module.css';
import Button from 'react-bootstrap/Button';
import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRegThumbsUp, FaThumbsUp, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import axios from 'axios';
import AuthContext from '../../../../utils/auth-context';
import ApplyTeamModal from '../../Team/ApplyTeamModal';
import { getAuthConfig } from '../../../../utils/auth';

function ContentView(props) {
  const { data } = props;
  const { board, tags, comments, article, team } = data;
  const { username } = useContext(AuthContext);
  console.log(team);

  const [isLiked, setIsLiked] = useState(article.marked_like);
  const [isScraped, setIsScraped] = useState(article.marked_scrap);
  const [likeCnt, setLikeCnt] = useState(article.like_cnt);
  const [scrapCnt, setScrapCnt] = useState(article.scrap_cnt);
  const [show, setShow] = useState(false);

  const domain_url = import.meta.env.VITE_SERVER_URL;
  const delete_url = `${domain_url}/community/api/article/${article.id}/delete/`;
  const like_url = `${domain_url}/community/api/article/${article.id}/like/`;
  const scrap_url = `${domain_url}/community/api/article/${article.id}/scrap/`;

  const dateObject = new Date(article.pub_date);
  const pub_date1 = dateObject.toISOString().slice(0, 10);
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const period = hours >= 12 ? 'p.m.' : 'a.m.';
  const pub_date2 = `${hours}:${minutes.toString().padStart(2, '0')}`;

  const navigate = useNavigate();

  const now = new Date();
  const recruit_start_date = new Date(article.period_start);
  const recruit_end_date = new Date(article.period_end);

  const backToBoard = (board) => {
    if (board.board_type === 'Recruit') {
      navigate('/community/recruit/' + board.name);
    } else if (board.board_type === 'Team') {
      navigate('/community/team/' + board.name);
    } else {
      navigate('/community/board/' + board.name);
    }
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
          backToBoard(board);
        }
      } catch (error) {
        console.log('error', error);
      }
    }
  };

  const onLike = async () => {
    try {
      const response = await axios.post(like_url, { article_id: article.id }, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        alert(res.message);
      } else {
        setIsLiked(res.data.marked_like);
        setLikeCnt(res.data.like_cnt);
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const onScrap = async () => {
    try {
      const response = await axios.post(scrap_url, { article_id: article.id }, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        alert(res.message);
      } else {
        setIsScraped(res.data.marked_scrap);
        setScrapCnt(res.data.scrap_cnt);
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <div className="d-flex flex-column">
      <div className={styles.articleBar}>
        <Button variant="secondary" style={{ width: '80px', marginRight: '50px' }} onClick={() => backToBoard(board)}>
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
          <span className={`col-md-9 ${styles.articleTitle}`}>{article.title}</span>
          <div>
            <span className={styles.articleInfo}>
              {article.anonymous_writer ? '익명' : <>{article.writer.user.username}</>}
            </span>
            <br></br>
            <span className={styles.articleInfo}>{pub_date1} </span>
            <span className={styles.articleInfo}>{pub_date2}</span>
          </div>
        </div>
        <div className={styles.articleContent}>
          <span dangerouslySetInnerHTML={{ __html: article.body }} className={styles.articleInfo}></span>
        </div>
        <div className="d-flex gap-1">
          {tags.map((tag) => (
            <span className={styles.articleInfo} style={{ fontWeight: '600' }} key={tag.name}>
              #{tag.name}
            </span>
          ))}
        </div>
        <div className={styles.articleBottom}>
          <div>
            <span className={styles.articleInfo}>조회수 {article.view_cnt} </span>
            <span className={styles.articleInfo}>댓글 {comments.length}</span>
          </div>
          <div className="d-flex gap-1">
            <span id="like-icon" onClick={onLike} style={{ cursor: 'pointer' }}>
              {isLiked ? <FaThumbsUp /> : <FaRegThumbsUp />}
            </span>
            <span>{likeCnt} </span>
            <span id="scrap-icon" onClick={onScrap} style={{ cursor: 'pointer' }}>
              {isScraped ? <FaBookmark /> : <FaRegBookmark />}
            </span>
            <span>{scrapCnt}</span>
          </div>
        </div>
      </div>

      {article.board.board_type == 'Recruit' && (
        <div className={styles.articleTeam}>
          <div>
            <img
              src={`${domain_url}${team.image}`}
              style={{ borderRadius: '50%', width: '100px', height: '100px' }}
            ></img>
          </div>
          <div>
            <div className="article-info-name">{team.name}</div>
            <div style={{ wordWrap: 'break-word' }}>{team.description}</div>
          </div>
          <div>
            <div>
              <div className="article-info-name">모집 기간</div>
              <div>시작: {recruit_start_date.toLocaleString()}</div>
              <div>마감: {recruit_end_date.toLocaleString()}</div>
            </div>
          </div>
          {now < recruit_start_date ? (
            <button className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
              모집 전
            </button>
          ) : now < recruit_end_date ? (
            <>
              <button type="button" className="btn btn-outline-primary" onClick={() => setShow(true)}>
                지원하기
              </button>
              {/* () => openApplyModal(team.name, team.description, username, show, setShow, article.id) */}
              <ApplyTeamModal
                teamName={team.name}
                teamDesc={team.description}
                username={username}
                show={show}
                onShowTeamApplyModal={setShow}
                articleId={article.id}
              />
            </>
          ) : (
            <button className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
              모집 마감
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ContentView;
