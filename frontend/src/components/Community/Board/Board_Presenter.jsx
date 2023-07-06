import '../Community.css';
import SideBar from '../SideBar/index.jsx';

export default function Board_Presenter(props) {
  const { board_name } = props;

  return (
    <div className="container my-4">
      <div className="row justify-content-end community-container">
        <SideBar />
        <div className="col-md-9 col-12 community-main">
          <div className="community-main-title">
            <div className="p-community-main">{board_name} 게시판</div>
          </div>
        </div>
      </div>
    </div>
  );
}
