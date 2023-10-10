import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function UserLayout() {
  const [isSideClosed, setIsSideClosed] = useState(false); // 사이드바 열림 여부
  const wrapperClass = isSideClosed ? 'fold' : '';
  return (
    <div className="container">
      <div id="wrapper" className={wrapperClass}>
        <Sidebar onToggle={() => setIsSideClosed((prev) => !prev)} />
        <div id="content-wrapper" className="px-3 py-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
