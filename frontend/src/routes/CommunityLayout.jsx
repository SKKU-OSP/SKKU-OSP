import { Outlet } from 'react-router-dom';
import SideBar from '../components/Community/SideBar/index.jsx';
import '../components/Community/Community.css';

export default function CommunityLayout() {
  return (
    <div className="container community-container">
      <SideBar />
      <Outlet />
    </div>
  );
}
