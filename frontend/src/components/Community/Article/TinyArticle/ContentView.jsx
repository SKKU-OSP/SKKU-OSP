import { useContext, useState } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import { FaBookmark, FaRegBookmark, FaRegThumbsUp, FaThumbsUp } from 'react-icons/fa';

import styles from '../Article.module.css';
import ApplyTeamModal from '../../Team/ApplyTeamModal';
import { getAuthConfig } from '../../../../utils/auth';
import AuthContext from '../../../../utils/auth-context';
import ProfileDropdown_Container from '../../ProfileDropdown';

const domain_url = import.meta.env.VITE_SERVER_URL;

function ContentView(props) {
  const { data } = props;
  const { board, tags, comments, article, team, files } = data;
  const { username } = useContext(AuthContext);

  const [isLiked, setIsLiked] = useState(article.marked_like);
  const [isScraped, setIsScraped] = useState(article.marked_scrap);
  const [likeCnt, setLikeCnt] = useState(article.like_cnt);
  const [scrapCnt, setScrapCnt] = useState(article.scrap_cnt);
  const [showApplyTeamModal, setShowApplyTeamModal] = useState(false);
  const navigate = useNavigate();

  const delete_url = `${domain_url}/community/api/article/${article.id}/delete/`;
  const like_url = `${domain_url}/community/api/article/${article.id}/like/`;
  const scrap_url = `${domain_url}/community/api/article/${article.id}/scrap/`;

  const dateObject = new Date(article.pub_date);
  const pub_date1 = dateObject.toISOString().slice(0, 10);
  const hours = dateObject.getHours();
  const minutes = dateObject.getMinutes();
  const pub_date2 = `${hours}:${minutes.toString().padStart(2, '0')}`;

  const now = new Date();
  const recruit_start_date = new Date(article.period_start);
  const recruit_end_date = new Date(article.period_end);

  recruit_start_date.setHours(recruit_start_date.getHours() - 9);
  recruit_end_date.setHours(recruit_end_date.getHours() - 9);

  const backToBoard = (board) => {
    if (board.board_type === 'Recruit') {
      navigate('/community/recruit/' + board.name);
    } else if (board.board_type === 'Team') {
      navigate('/community/team/' + board.name);
    } else {
      navigate('/community/board/' + board.name);
    }
  };

  const logIn = () => {
    if (!username) {
      if (window.confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      }
      return;
    }
  };

  const onDownloadFile = async (file) => {
    try {
      const url = `${domain_url}/community/api/article/${article.id}/file/${file.id}/`;
      const response = await axios.get(url, { responseType: 'blob' });
      console.log(response);
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));

      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = file.name;
      a.click();
      a.remove();
    } catch (error) {
      console.log(error);
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
    if (!username) {
      if (window.confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      }
      return;
    } else {
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
    }
  };

  const onScrap = async () => {
    if (!username) {
      if (window.confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      }
      return;
    } else {
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
    }
  };

  return (
    <div className="d-flex flex-column">
      <div className={styles.articleBar}>
        <Button variant="secondary" className={styles.articleButton} onClick={() => backToBoard(board)}>
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
              {article.anonymous_writer ? (
                '익명'
              ) : (
                <ProfileDropdown_Container userName={article.writer.user.username} userId={article.writer.user.id} />
              )}
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
            <span id="like-icon" onClick={() => onLike()} style={{ cursor: 'pointer' }}>
              {isLiked ? <FaThumbsUp /> : <FaRegThumbsUp />}
            </span>
            <span>{likeCnt} </span>
            <span id="scrap-icon" onClick={() => onScrap()} style={{ cursor: 'pointer' }}>
              {isScraped ? <FaBookmark /> : <FaRegBookmark />}
            </span>
            <span>{scrapCnt}</span>
          </div>
        </div>
      </div>
      {files.length != 0 && (
        <div className={styles.articleFileList}>
          {files.map((file) => {
            return (
              <div key={file.name} className={styles.articleFile} onClick={() => onDownloadFile(file)}>
                <span className={styles.articleFileName}>{file.name}</span>
                <span>{file.size}</span>
              </div>
            );
          })}
        </div>
      )}

      {article.board.board_type == 'Recruit' && (
        <>
          {team && (
            <div className={styles.articleTeam}>
              <span className={styles.articleTeamDivide}>
                <div>
                  <img
                    src={`${domain_url}${team.image}`}
                    style={{ borderRadius: '50%', width: '100px', height: '100px' }}
                  ></img>
                </div>
                <div>
                  <div className="article-info-name">{team.name}</div>
                  <div>{team.description}</div>
                </div>
              </span>
              <span className={styles.articleTeamDivide}>
                <span>
                  <div>
                    <div className="article-info-name">모집 기간</div>
                    <div>시작: {recruit_start_date.toLocaleString()}</div>
                    <div>마감: {recruit_end_date.toLocaleString()}</div>
                  </div>
                </span>
                {now < recruit_start_date ? (
                  <button className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
                    모집 전
                  </button>
                ) : now < recruit_end_date ? (
                  <>
                    {username ? (
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setShowApplyTeamModal(true)}
                      >
                        지원하기
                      </button>
                    ) : (
                      <button type="button" className="btn btn-outline-secondary" onClick={() => logIn()}>
                        지원하기
                      </button>
                    )}
                  </>
                ) : (
                  <button className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
                    모집 마감
                  </button>
                )}
              </span>
              <ApplyTeamModal
                teamName={team.name}
                teamDesc={team.description}
                username={username}
                show={showApplyTeamModal}
                onShowTeamApplyModal={setShowApplyTeamModal}
                articleId={article.id}
              />
            </div>
          )}

          {!team && <div className={styles.articleTeam}>팀 정보가 없습니다. 지원할 수 없습니다.</div>}
        </>
      )}
    </div>
  );
}

export default ContentView;
