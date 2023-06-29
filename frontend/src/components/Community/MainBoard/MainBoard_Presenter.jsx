import "../Community.css"

export default function MainBoard_Presenter() {
  return (
    <div className="container my-4">
      <div class="row justify-content-end community-container">
        {/* {% include "community/sidebar.html" with board=board %} */}
        <div className="col-md-9 col-12 community-main">
          <div className="community-main-title">
            <div className="p-community-main">
              커뮤니티
            </div>
          </div>
          <div className="card boards-card">
            <div className="card-body text-center d-flex flex-wrap">
              <div className="col-md-6 col-12 main-board">
                <div className="main-board-head d-flex justify-content-between">
                  <div className="main-board-title">
                    자유 게시판
                  </div>
                  <div className="main-board-more">
                    <a href="/community/board/{{boards.0.name}}/{{boards.0.id}}">더보기 &gt;</a>
                  </div>
                </div>
                <div className="article-list-section">
                  {/* */}
                </div>
              </div>

              <div className="col-md-6 col-12 main-board">
                <div className="main-board-head d-flex justify-content-between">
                  <div className="main-board-title">
                    질문 게시판
                  </div>
                  <div className="main-board-more">
                    <a href="/community/board/{{boards.1.name}}/{{boards.1.id}}">더보기 &gt;</a>
                  </div>
                </div>
                <div className="article-list-section">
                  {/* {% include "community/article-bar.html" with article_list=boards.0.article_list board=boards.0 %} */}
                </div>
              </div>

              <div className="col-md-6 col-12 main-board">
                <div className="main-board-head d-flex justify-content-between">
                  <div className="main-board-title">
                    정보 게시판
                  </div>
                  <div className="main-board-more">
                    <a href="/community/board/{{boards.2.name}}/{{boards.2.id}}">더보기 &gt;</a>
                  </div>
                </div>
                <div className="article-list-section">
                  {/* {% include "community/article-bar.html" with article_list=boards.2.article_list board=boards.2 %} */}
                </div>
              </div>

              <div className="col-md-6 col-12 main-board">
                <div className="main-board-head d-flex justify-content-between">
                  <div className="main-board-title">
                    홍보 게시판
                  </div>
                  <div className="main-board-more">
                    <a href="/community/board/{{boards.3.name}}/{{boards.3.id}}">더보기 &gt;</a>
                  </div>
                </div>
                <div className="article-list-section">
                  {/* {% include "community/article-bar.html" with article_list=boards.3.article_list board=boards.3 %} */}
                </div>
              </div>

              <div className="col-12 main-board">
                <div className="main-board-head d-flex justify-content-between">
                  <div className="main-board-title">
                    팀 모집 게시판
                  </div>
                  <div className="main-board-more">
                    <a href="/community/board/{{boards.3.name}}/{{boards.3.id}}">더보기 &gt;</a>
                  </div>
                </div>
                <div className="article-list-section">
                  {/* {% include "community/article-bar.html" with article_list=boards.1.article_list board=boards.1 %} */}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
