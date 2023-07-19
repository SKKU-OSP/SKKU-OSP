import { Outlet } from 'react-router-dom';

import MainHeader from '../components/MainHeader';
import { AuthContextProvider } from '../utils/auth-context.jsx';

function RootLayout() {
  return (
    <AuthContextProvider>
      <MainHeader />
      <Outlet />
    </AuthContextProvider>
  );
}

export default RootLayout;
