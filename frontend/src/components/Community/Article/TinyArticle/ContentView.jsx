import { useContext, useState } from 'react';

import axios from 'axios';
import axiosInstance from '../../../../utils/axiosInterCeptor';
import { useNavigate } from 'react-router-dom';
import { FaBookmark, FaRegBookmark, FaRegThumbsUp, FaThumbsUp } from 'react-icons/fa';
import { BsThreeDotsVertical, BsChevronLeft, BsPencilFill, BsTrash } from 'react-icons/bs';

import ApplyTeamModal from '../../Team/ApplyTeamModal';
import { getAuthConfig } from '../../../../utils/auth';
import AuthContext from '../../../../utils/auth-context';
import ProfileDropdown_Container from '../../ProfileDropdown';
import DropdownButton from 'react-bootstrap/esm/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';

const domain_url = import.meta.env.VITE_SERVER_URL;

function ContentView(props) {
  const { data } = props;
  const { board, tags, article, team, files } = data;
  const { username } = useContext(AuthContext);

  const [isLiked, setIsLiked] = useState(article.marked_like);
  const [isScraped, setIsScraped] = useState(article.marked_scrap);
  const [likeCnt, setLikeCnt] = useState(article.like_cnt);
  const [scrapCnt, setScrapCnt] = useState(article.scrap_cnt);
  const [showApplyTeamModal, setShowApplyTeamModal] = useState(false);
  const [isHero, setIsHero] = useState(false);
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
        const response = await axiosInstance.post(delete_url, { article_id: article.id }, getAuthConfig());
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
        const response = await axiosInstance.post(like_url, { article_id: article.id }, getAuthConfig());
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
        const response = await axiosInstance.post(scrap_url, { article_id: article.id }, getAuthConfig());
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
    <div id="community-main" className="d-flex flex-column">
      <div className="community-nav d-flex">
        <div>
          <button type="button" className="btn-back" onClick={() => backToBoard(board)}>
            <BsChevronLeft style={{ marginRight: '7px', marginBottom: '5px' }} />글 목록
          </button>
        </div>
        <div className="board-name"> {board.name} 게시판</div>
        <div>
          <button type="submit" className="btn-write" style={{ visibility: 'hidden' }}>
            <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
            작성하기
          </button>
        </div>
      </div>
      <div className="article-design">
        <div className="article-container">
          <div id="article-title" className="col-md-9">
            {article.title}
          </div>
          <div id="article-writer">
            <span className="article-info">
              {article.anonymous_writer ? (
                '익명'
              ) : (
                <ProfileDropdown_Container userName={article.writer?.user.username} userId={article.writer?.user.id} />
              )}
            </span>
          </div>
          <div id="article-writer" style={{ flexGrow: '0.3' }}>
            <span className="artice-pubdate">
              {pub_date1} {pub_date2}
            </span>
          </div>
          {username === article.writer?.user.username || username == 'admin' ? (
            <Dropdown className="article-more" style={{ display: 'inline-block' }}>
              <Dropdown.Toggle as="span" id="dropdown-custom-component" className="dropdownbtn">
                <BsThreeDotsVertical />
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={onEdit}>
                  <BsPencilFill style={{ marginRight: '10px' }} />
                  수정
                </Dropdown.Item>
                <Dropdown.Item onClick={onDelete}>
                  <BsTrash style={{ marginRight: '10px' }} />
                  삭제
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <Dropdown className="article-more hidden">
              <Dropdown.Toggle id="dropdown-button">
                <BsThreeDotsVertical />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={onEdit}>
                  <BsPencilFill style={{ marginRight: '10px' }} />
                  수정
                </Dropdown.Item>
                <Dropdown.Item onClick={onDelete}>
                  <BsTrash style={{ marginRight: '10px' }} />
                  삭제
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
        <div className="divider"></div>
        <div className="article-info article-view">
          <span className="hidden"></span>
          <span>조회수 {article.view_cnt} </span>
        </div>
        <div className="article-body">
          <span dangerouslySetInnerHTML={{ __html: article.body }} className="article-info"></span>
        </div>
        <div className="d-flex gap-1 article-tags">
          {tags.map((tag) => (
            <span className="article-info" style={{ fontWeight: '600' }} key={tag.name}>
              #{tag.name}
            </span>
          ))}
        </div>
        {files.length != 0 && (
          <div className="article-file-list">
            {files.map((file) => {
              return (
                <div key={file.name} className="article-files" onClick={() => onDownloadFile(file)}>
                  <span className="article-file-name">{file.name}</span>
                  <span>{file.size}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="article-bottom-list">
          <div className="d-flex gap-3">
            <div id="like-icon" onClick={() => onLike()} style={{ cursor: 'pointer' }}>
              <span>{isLiked ? <FaThumbsUp size={25} /> : <FaRegThumbsUp size={25} />}</span>
              <span>{likeCnt}</span>
            </div>
            <div id="scrap-icon" onClick={() => onScrap()} style={{ cursor: 'pointer' }}>
              <span>{isScraped ? <FaBookmark size={25} /> : <FaRegBookmark size={25} />}</span>
              <span>{scrapCnt}</span>
            </div>
          </div>
        </div>
        {article.board.board_type == 'Recruit' ? (
          <div className="divider"></div>
        ) : (
          <div className="divider hidden"></div>
        )}
        {article.board.board_type == 'Recruit' && (
          <>
            {team && (
              <div className="article-team">
                <span className="article-team-divide">
                  <div>
                    <img src={`${domain_url}${team.image}`}></img>
                  </div>
                  <div>
                    <div className="article-info-name">{team.name}</div>
                    <div>{team.description}</div>
                  </div>
                </span>
                <span className="article-team-divide">
                  <div className="article-team-img">
                    <img className="hidden" src={`${domain_url}${team.image}`}></img>
                  </div>
                  <span>
                    <div>
                      <div className="article-info-name" style={{ fontWeight: '500' }}>
                        모집 기간
                      </div>
                      <div>{recruit_start_date.toLocaleString()}~</div>
                      <div>{recruit_end_date.toLocaleString()}</div>
                    </div>
                  </span>
                  {now < recruit_start_date ? (
                    <button
                      type="button"
                      className="board-team-recruit-off"
                      style={{ pointerEvents: 'none', padding: '10px 12px' }}
                    >
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
                    <button
                      type="button"
                      className="board-team-recruit-off"
                      style={{ pointerEvents: 'none', padding: '10px 12px' }}
                    >
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

            {!team && <div className="articleTeam">팀 정보가 없습니다. 지원할 수 없습니다.</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default ContentView;
