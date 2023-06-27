import { Outlet } from 'react-router-dom';

import BoardOverview from '../components/BoardOverview';
function Community() {
  return (
    <>
      <Outlet />
      <main>
        <BoardOverview />
      </main>
    </>
  );
}

export default Community;
