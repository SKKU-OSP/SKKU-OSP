import '../Community.css';
import TinyBoard from './TinyBoard/index.jsx';

export default function MainBoard_Presenter() {
  return (
    <div className="container">
      <div className="row justify-content-end community-container">
        <SideBar />
        <div className="col-md-9 col-12 community-main">dd</div>
      </div>
    </div>
  );
}
