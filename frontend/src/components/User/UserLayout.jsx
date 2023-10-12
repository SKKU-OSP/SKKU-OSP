import { Outlet, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useContext, useState } from 'react';
import AuthContext from '../../utils/auth-context';

export default function UserLayout() {
  const [isSideClosed, setIsSideClosed] = useState(false); // 사이드바 열림 여부
  const wrapperClass = isSideClosed ? 'fold' : '';
  const paramsUsername = useParams().username;
  const { username } = useContext(AuthContext);

  return (
    <div className="container">
      {username === paramsUsername ? (
        <div id="wrapper" className={wrapperClass}>
          <Sidebar onToggle={() => setIsSideClosed((prev) => !prev)} />
          <div id="content-wrapper" className="px-3 py-5">
            <Outlet />
          </div>
        </div>
      ) : (
        <div id="content-wrapper" className="px-3 py-5">
          <Outlet />
        </div>
      )}
    </div>
  );
}
