import { Outlet } from 'react-router-dom';
import SideBar from '../components/Community/SideBar/index.jsx';

export default function CommunityLayout() {
  return (
    <div className="container">
      <div className="row justify-content-end community-container">
        <SideBar />
        <Outlet />
      </div>
    </div>
  );
}
