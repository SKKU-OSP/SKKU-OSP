import '../Community.css';
import TinyBoard from './TinyBoard/index.jsx';

export default function MainBoard_Presenter() {
  return (
    <div className="container my-4">
      <div className="row justify-content-end community-container">
        {/* {% include "community/sidebar.html" with board=board %} */}
        <div className="col-md-9 col-12 community-main">
          <div className="community-main-title">
            <div className="p-community-main">커뮤니티</div>
          </div>
          <div className="card boards-card">
            <div className="card-body text-center d-flex flex-wrap">
              <div className="col-md-6 col-12 main-board">
                <TinyBoard board_name="자유" board_id="0" />
              </div>

              <div className="col-md-6 col-12 main-board">
                <TinyBoard board_name="질문" board_id="1" />
              </div>

              <div className="col-md-6 col-12 main-board">
                <TinyBoard board_name="정보" board_id="5" />
              </div>

              <div className="col-md-6 col-12 main-board">
                <TinyBoard board_name="홍보" board_id="6" />
              </div>

              <div className="col-12 main-board">
                <TinyBoard board_name="팀 모집" board_id="2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
