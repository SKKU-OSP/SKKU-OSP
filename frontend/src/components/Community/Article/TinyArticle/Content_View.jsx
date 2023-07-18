import '../../Community.css';
import { FaRegThumbsUp, FaThumbsUp, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import '../Article.css';
import '../base.css';

function Content_View(props) {
  // {% load tag_templatetag %}
  // {% load community_tag %}
  // {% load team_tag %}
  // {% load markdown_filter %}
  // {% load static %}
  const board = props.board;
  const tags = props.tags;
  const comments = props.comments;
  const article = props.article;
  const user = { id: 1, is_authenticated: false };
  const request = {
    user: { username: 'hoya', id: 1234, is_authenticated: false, is_superuser: false, is_anonymous: false }
  };
  const article_file = [];
  const is_start = true;
  const is_end = true;
  const is_thumb_up = false;
  const is_teammember = true;
  const is_scrap = false;
  const waited_teamapplymessage = true;
  let pub_date1, pub_date2;
  if (article !== null) {
    const dateObject = new Date(article.pub_date);
    pub_date1 = dateObject.toISOString().slice(0, 10);
    const hours = dateObject.getHours();
    const minutes = dateObject.getMinutes();
    const period = hours >= 12 ? 'p.m.' : 'a.m.';
    const formattedHours = hours % 12 || 12;
    pub_date2 = `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
  return (
    <>
      {board && article ? (
        <>
          <div id="board-title-bar" className="flex-between">
            <div id="board-title" className="p-board-title">
              {board.board_type !== 'Notice' ? (
                <a href={`/community/board/${board.name}/${board.id}`}>{board.name} 게시판</a>
              ) : (
                <>{board.name} 게시판</>
              )}
            </div>
            {/* user == article.writer.user */}
            {user.id === article.writer && (
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-light" onClick="edit();">
                  <i className="bi-pencil-square"></i> 수정
                </button>
                <button type="button" id="btn-content-delete" className="btn btn-outline-light">
                  <form>
                    <i className="bi bi-trash"></i>
                    <input type="hidden" id="board-name" value={board.name} />
                    <input type="hidden" id="board-id" value={board.id} />
                    <input type="hidden" id="article-id" value={article.id} />
                    <span className="hover-opacity">삭제</span>
                  </form>
                </button>
              </div>
            )}
          </div>
          <div id="article-wrapper">
            <div id="article-title-wrapper" className="d-flex flex-row justify-content-between gap-2">
              <div id="article-title" className="fs-5">
                {/*article.team.name |default:"팀이 더이상 존재하지 않습니다."*/}
                {board.board_type === 'Recruit' && 'default: 팀이 더이상 존재하지 않습니다.'}
                {article.title}
              </div>
              <div id="article-metadata">
                <div className="d-flex flex-column justify-content-center">
                  {article.anonymous_writer ? (
                    익명
                  ) : // article.writer.user.username
                  article.writer === null ? (
                    탈퇴한이용자
                  ) : request.user.is_authenticated ? (
                    <div className="dropdown writer-dropdown">
                      <button
                        className="dropdown-toggle writer-dropdown-btn"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        {/* article.writer.user.username */}
                        {article.writer}
                      </button>
                      <ul className="dropdown-menu">
                        {/*article.writer.user.is_superuser*/}( !article.writer &&
                        <li>
                          {/* article.writer.user.username */}
                          <a className="dropdown-item" href={`/user/${article.writer}`}>
                            프로필
                          </a>
                        </li>
                        )
                        <li>
                          {/* article.writer.user.id */}
                          <a className="dropdown-item" href="#" onclick={`msgModalOpen(${article.writer})`}>
                            메시지
                          </a>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    // article.writer.user.username
                    <>{article.writer}</>
                  )}
                </div>
                <div id="article-datetime">
                  {/* "Y-m-d" */}
                  <div>{pub_date1}</div>
                  {/* h:i a */}
                  <div>{pub_date2}</div>
                </div>
              </div>
            </div>
            <div id="article-title-border"></div>

            <div>
              {/* article.body|safe|mark */}
              <div id="article-body">{article.body}</div>
            </div>
            <div id="article-taglist">
              {tags.map((tag) => (
                <div className={`badge bg-tag-${tag.type}`}>#{tag.name}</div>
              ))}
              {tags.length === 0 && <span className="ps-1">태그 없음</span>}
            </div>
            <div className="d-flex justify-content-between">
              <div id="article-view-reply">
                <span>조회수</span>
                <span>{article.view_cnt}</span>
                <span>댓글</span>
                <span>{comments.length}</span>
              </div>
              <div id="article-like-scrap">
                <div
                  id="article-like-btn"
                  className="h-100 hover-opacity"
                  onclick={`ArticleThumbUp(${article.id},${request.user.id}`}
                >
                  {/* {% is_article_thumb_up article request.user as is_thumb_up %} */}
                  {!is_thumb_up ? (
                    <span className="material-icons-outlined">
                      <FaRegThumbsUp />
                    </span>
                  ) : (
                    <span className="material-icons">
                      <FaThumbsUp />
                    </span>
                  )}
                </div>
                <div>
                  <span id="article-like-cnt">{article.article_like}</span>
                </div>
                {/* {% is_article_scrap article request.user as is_scrap %} */}
                <div
                  id="article-scrap-btn"
                  className="h-100 hover-opacity"
                  onclick={`ArticleScrap(${article.id},${request.user.id}`}
                >
                  <span className="material-icons-outlined">{is_scrap ? <FaBookmark /> : <FaRegBookmark />}</span>
                </div>
                <div>
                  <span id="article-scrap-cnt">{article.article_scrap}</span>
                </div>
              </div>
            </div>
          </div>
          {article_file.length > 0 && (
            <div id="article-file-container" className="d-flex flex-wrap shadow-box p-3 mt-2 bg-white rounded-3">
              <span className="d-inline px-2">첨부파일</span>
              {article_file.map((obj) => (
                <span className="d-flex flex-nowrap px-2 text-nowrap">
                  <a href={`download/file/${obj.id}`} className="text-truncate file-block">
                    {obj.name}
                  </a>
                  ({obj.size})
                </span>
              ))}
            </div>
          )}
          {board.board_type == 'Recruit' && (
            <div id="article-teamcard">
              {/* article.team  */}
              {article.period_start !== null ? (
                <>
                  <div className="d-flex col">
                    <div className="small-radius-image m-2">
                      {/* {`${article.team.image.url}`} */}
                      <img src="article.team.image.url" alt="team-image" />
                    </div>
                    <div className="m-2">
                      <div className="article-info-name">{article.team.name}</div>
                      <div className="article-info-desc desc-break">{article.team.description}</div>
                    </div>
                  </div>
                  <div className="d-flex col justify-content-between m-2">
                    <div>
                      {/* {% is_period_end article.period_end as is_end %} */}
                      {/* {% is_period_end article.period_start as is_start %} */}
                      <div className="article-info-name">모집기간</div>
                      <div>
                        시작: {article.period_start}
                        <br>마감: {article.period_end}</br>
                        {!is_start ? (
                          <div className="sub-point-text">{article.period_start}</div>
                        ) : (
                          !is_end && <div className="sub-point-text">{article.period_end}</div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex align-items-center">
                      {!is_start ? (
                        <div className="recruit-badge recruit-inactive mx-1">모집 전</div>
                      ) : !is_end ? (
                        <div className="recruit-badge recruit-active mx-1">모집 중</div>
                      ) : (
                        <div className="recruit-badge recruit-inactive mx-1">모집 마감</div>
                      )}
                      <div className="recruit-badge recruit-inactive mx-1">모집 전</div>
                      {/* {% is_teammember article.team request.user as is_teammember %} */}
                      {/* {% teamapplymessage article.team request.user as waited_teamapplymessage %} */}
                      {!is_teammember &&
                        is_start &&
                        !is_end &&
                        (!waited_teamapplymessage ? (
                          request.user.is_anonymous ? (
                            <button
                              className="recruit-btn hover-opacity mx-1"
                              onclick="alert('로그인 후 이용해주세요.')"
                              data-team-id="{{ article.team.id }}"
                            >
                              지원하기
                            </button>
                          ) : (
                            <button
                              className="recruit-btn hover-opacity mx-1"
                              onclick="openTeamApplyModal({{ article.team.id }});"
                              data-team-id="{{ article.team.id }}"
                            >
                              지원하기
                            </button>
                          )
                        ) : (
                          <div className="recruit-badge recruit-inactive">
                            {waited_teamapplymessage.get_status_display}
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div>팀 정보가 없습니다.</div>
              )}
            </div>
          )}
          {user.is_authenticated && <div id="AddTeamApplyModal" className="modal modal-lg fade"></div>}
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default Content_View;
