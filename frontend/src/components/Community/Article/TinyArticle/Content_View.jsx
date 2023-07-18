import '../../Community.css';
import '../Article.css';

function Content_View() {
  // {% load tag_templatetag %}
  // {% load community_tag %}
  // {% load team_tag %}
  // {% load markdown_filter %}
  // {% load static %}
  const board = { name: '질문', id: '1', board_type: 'Notice' };
  const user = { id: 1 };
  const article = { id: 1, writer: { user: { id: 1 } } };
  return (
    <>
      <div id="board-title-bar" class="flex-between">
        <div id="board-title" class="p-board-title">
          {board.board_type !== 'Notice' ? (
            <a href={`/community/board/${board.name}/${board.id}`}>{board.name} 게시판</a>
          ) : (
            <>{board.name} 게시판</>
          )}
        </div>
        {user === article.writer.user && (
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-light" onClick="edit();">
              <i class="bi-pencil-square"></i> 수정
            </button>
            <button type="button" id="btn-content-delete" class="btn btn-outline-light">
              <form>
                <i class="bi bi-trash"></i>
                <input type="hidden" id="board-name" value={board.name} />
                <input type="hidden" id="board-id" value={board.id} />
                <input type="hidden" id="article-id" value={article.id} />
                <span class="hover-opacity">삭제</span>
              </form>
            </button>
          </div>
        )}
      </div>
      <div id="article-wrapper">
        <div id="article-title-wrapper" class="d-flex flex-row justify-content-between gap-2">
          <div id="article-title" class="fs-5">
            {board.board_type === 'Recruit' && article.team.name | 'default: 팀이 더이상 존재하지 않습니다.'}
            {article.title}
          </div>
          <div id="article-metadata">
            <div class="d-flex flex-column justify-content-center">
              {article.anonymous_writer ? (
                익명
              ) : article.writer.user.username === null ? (
                탈퇴한이용자
              ) : request.user.is_authenticated ? (
                <div class="dropdown writer-dropdown">
                  <button
                    class="dropdown-toggle writer-dropdown-btn"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {article.writer.user.username}
                  </button>
                  <ul class="dropdown-menu">
                    ( !article.writer.user.is_superuser &&
                    <li>
                      <a class="dropdown-item" href={`/user/${article.writer.user.username}`}>
                        프로필
                      </a>
                    </li>
                    )
                    <li>
                      <a class="dropdown-item" href="#" onclick={`msgModalOpen(${article.writer.user.id})`}>
                        메시지
                      </a>
                    </li>
                  </ul>
                </div>
              ) : (
                <>{article.writer.user.username}</>
              )}
            </div>
            <div id="article-datetime">
              <div>{article.pub_date}</div>
              <div>{article.pub_date}</div>
            </div>
          </div>
        </div>
        <div id="article-title-border"></div>

        <div>
          <div id="article-body">{article.body}</div>
        </div>
        <div id="article-taglist">
          {tags.map((tag) => (
            <div className={`badge bg-tag-${tag.tag.type}`}>#{tag.tag.name}</div>
          ))}
          {tags.length === 0 && <span className="ps-1">태그 없음</span>}
        </div>
        <div class="d-flex justify-content-between">
          <div id="article-view-reply">
            <span>조회수</span>
            <span>{article.view_cnt}</span>
            <span>댓글</span>
            <span>{comments}</span>
          </div>
          <div id="article-like-scrap">
            <div
              id="article-like-btn"
              class="h-100 hover-opacity"
              onclick={`ArticleThumbUp(${article.id},${request.user.id}`}
            >
              {!is_thumb_up ? (
                <span class="material-icons-outlined">thumb_up</span>
              ) : (
                <span class="material-icons">thumb_up</span>
              )}
            </div>
            <div>
              <span id="article-like-cnt">{article.article_like}</span>
            </div>
            <div
              id="article-scrap-btn"
              class="h-100 hover-opacity"
              onclick={`ArticleScrap(${article.id},${request.user.id}`}
            >
              <span class="material-icons-outlined">{is_scrap ? bookmark : bookmark_border}</span>
            </div>
            <div>
              <span id="article-scrap-cnt">{article.article_scrap}</span>
            </div>
          </div>
        </div>
      </div>
      {article_file && (
        <div id="article-file-container" class="d-flex flex-wrap shadow-box p-3 mt-2 bg-white rounded-3">
          <span class="d-inline px-2">첨부파일</span>
          {article_file.map((obj) => (
            <span class="d-flex flex-nowrap px-2 text-nowrap">
              <a href={`download/file/${obj.id}`} class="text-truncate file-block">
                {obj.name}
              </a>
              ({obj.size})
            </span>
          ))}
        </div>
      )}
      {board.board_type == 'Recruit' && (
        <div id="article-teamcard">
          {article.team ? (
            <>
              <div class="d-flex col">
                <div class="small-radius-image m-2">
                  <img src={`${article.team.image.url}`} alt="team-image" />
                </div>
                <div class="m-2">
                  <div class="article-info-name">{article.team.name}</div>
                  <div class="article-info-desc desc-break">{article.team.description}</div>
                </div>
              </div>
              <div class="d-flex col justify-content-between m-2">
                <div>
                  <div class="article-info-name">모집기간</div>
                  <div>
                    시작: {article.period_start}
                    <br>마감: {article.period_end}</br>
                    {!is_start ? (
                      <div class="sub-point-text">{article.period_start}</div>
                    ) : (
                      !is_end && <div class="sub-point-text">{article.period_end}</div>
                    )}
                  </div>
                </div>

                <div class="d-flex align-items-center">
                  {!is_start ? (
                    <div class="recruit-badge recruit-inactive mx-1">모집 전</div>
                  ) : !is_end ? (
                    <div class="recruit-badge recruit-active mx-1">모집 중</div>
                  ) : (
                    <div class="recruit-badge recruit-inactive mx-1">모집 마감</div>
                  )}
                  <div class="recruit-badge recruit-inactive mx-1">모집 전</div>
                  {!is_teammember &&
                    is_start &&
                    !is_end &&
                    (!waited_teamapplymessage ? (
                      request.user.is_anonymous ? (
                        <button
                          class="recruit-btn hover-opacity mx-1"
                          onclick="alert('로그인 후 이용해주세요.')"
                          data-team-id="{{ article.team.id }}"
                        >
                          지원하기
                        </button>
                      ) : (
                        <button
                          class="recruit-btn hover-opacity mx-1"
                          onclick="openTeamApplyModal({{ article.team.id }});"
                          data-team-id="{{ article.team.id }}"
                        >
                          지원하기
                        </button>
                      )
                    ) : (
                      <div class="recruit-badge recruit-inactive">{waited_teamapplymessage.get_status_display}</div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div>팀 정보가 없습니다.</div>
          )}
        </div>
      )}
      {user.is_authenticated && <div id="AddTeamApplyModal" class="modal modal-lg fade"></div>}
    </>
  );
}

export default Content_View;
