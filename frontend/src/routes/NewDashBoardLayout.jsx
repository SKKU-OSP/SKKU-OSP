import { Outlet } from 'react-router-dom';
import NewDashBoardSidebar from '../components/NewDashBoard/NewDashBoardSidebar';
import { useState } from 'react';

export default function NewDashBoardLayout() {
  const [isSideClosed, setIsSideClosed] = useState(false);
  const wrapperClass = isSideClosed ? 'fold' : '';

  return (
    <div className="container">
      <div id="wrapper" className={wrapperClass}>
        <NewDashBoardSidebar onToggle={() => setIsSideClosed((prev) => !prev)} isToggled={isSideClosed} />
        <div id="content-wrapper" className="px-3 py-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
