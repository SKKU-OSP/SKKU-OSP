import { Outlet } from 'react-router-dom';
import '../components/Community/Community.css';

export default function InquiryLayout() {
  return (
    <div className="container d-flex align-items-start" style={{ justifyContent: 'center' }}>
      {/* 문의게시판은 사이드바가 없으므로 SideBar는 추가하지 않음 */}
      <Outlet />
    </div>
  );
}
