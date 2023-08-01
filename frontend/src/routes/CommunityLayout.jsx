import { Outlet } from 'react-router-dom';
import SideBar from '../components/Community/SideBar/index.jsx';

export default function CommunityLayout() {
  return (
    <div className="container d-flex">
      <SideBar />
      <Outlet />
    </div>
  );
}
