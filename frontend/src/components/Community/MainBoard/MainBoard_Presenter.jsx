import '../Community.css';
import TinyBoard from './TinyBoard/index.jsx';

export default function MainBoard_Presenter() {
  return (
    <div className="col-md-9 col-12 community-main">
      <div className="community-main-title">
        <div className="p-community-main">커뮤니티</div>
      </div>
      <div className="card boards-card">
        <div className="card-body text-center d-flex flex-wrap">
          <div className="col-md-6 col-12 main-board">
            <TinyBoard board_name="자유" />
          </div>

          <div className="col-md-6 col-12 main-board">
            <TinyBoard board_name="질문" />
          </div>

          <div className="col-md-6 col-12 main-board">
            <TinyBoard board_name="정보" />
          </div>

          <div className="col-md-6 col-12 main-board">
            <TinyBoard board_name="홍보" />
          </div>

          <div className="col-12 main-board">
            <TinyBoard board_name="팀 모집" />
          </div>
        </div>
      </div>
    </div>
  );
}
