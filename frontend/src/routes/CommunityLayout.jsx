import { Outlet } from 'react-router-dom';
import SideBar from '../components/Community/SideBar/index.jsx';
import '../components/Community/Community.css';

export default function CommunityLayout() {
  return (
    <div className="container d-flex align-items-start">
      <SideBar />
      <Outlet />
    </div>
  );
}
