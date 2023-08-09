import '../Recommender.css';

function RecommenderMain() {
  const is_open = false;
  const teams = [];
  const board = { name: '정보' };
  const max_page = 10;
  return (
    <>
      {is_open ? (
        <>
          <form id="team-filter" method="post" class="w-100 border d-flex flex-wrap gap-2 fs-7">
            {/* {% get_team request.user as teams %} */}
            {teams.map((team) => (
              <div key={team.id} className="form-check form-check-inline">
                <input
                  type="checkbox"
                  className="form-check-input btn-check"
                  name="teams"
                  id={`filter-${team.id}`}
                  value={team.id}
                  autoComplete="off"
                />
                <label className="btn btn-light btn-filter form-check-label" htmlFor={`filter-${team.id}`}>
                  {team.name} 추천
                  <i className="bi bi-check2 fs-6 ps-1"></i>
                </label>
              </div>
            ))}
            <button type="button" id="btn-team-filter" class="btn btn-primary">
              적용
            </button>
          </form>
          <div id="body-content" class="flex-start my-2">
            <div class="spinner-border m-auto mt-5" role="status"></div>
          </div>
          <div id="article-list-footer" class="d-flex justify-content-end mt-3">
            <div id="article-list-pagination">
              <div id="pagination-body" data-board-name={`${board.name}`} data-max-page={`${max_page}`}></div>
            </div>
          </div>
        </>
      ) : (
        <div>
          <p>정보공개에 동의하지 않아 사용할 수 없는 기능입니다.</p>
          <button class="btn btn-primary" onclick="consentUserOpen('{{request.user.username}}');">
            정보공개하기
          </button>
        </div>
      )}
    </>
  );
}

export default RecommenderMain;
