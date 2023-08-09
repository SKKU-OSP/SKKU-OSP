import '../Recommender.css';

function RecommenderBar() {
  return (
    <div id="board-title-bar" class="flex-between" data-board-value="{{board.name}}_{{board.id}}">
      <div id="board-title" class="p-board-title">
        <a href="/community/recommender/user/">맞춤 유저 추천</a>
      </div>
      <div id="user-filter">
        {/* {% include "community/board/user-searcher.html" with board=board %} */}
        <div class="d-flex justify-content-between shadow-box rounded-2">
          <div id="search-field" class="input-group">
            <input
              type="text"
              id="search-username"
              class="form-control"
              placeholder="Username"
              aria-describedby="search-btn"
            />
            <input type="hidden" class="form-control" id="user-board" value="user" aria-describedby="search-btn" />
            <button type="button" id="user-tag-btn" class="btn btn-light" onclick="toggleUserTag();">
              #
            </button>
            <button type="button" id="user-search-btn" class="btn btn-light">
              검색
            </button>
          </div>
        </div>
        <div id="user-tag-filter">
          <select id="tag-select" name="tag-filter-select" multiple>
            {/* {% category_tag request %} */}
          </select>
        </div>
      </div>
    </div>
  );
}

export default RecommenderBar;
