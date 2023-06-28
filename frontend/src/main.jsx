import ReactDOM from 'react-dom/client';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';

import RootLayout from './routes/RootLayout';
import Community from './routes/Community';
import LoginPage from './routes/LoginPage';
import OAuthPage from './routes/OAuthPage';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'community',
        element: <Community />,
        children: []
      },
      {
        path: 'accounts',
        element: <Outlet />,
        children: [
          {
            path: 'login',
            element: <LoginPage />
          },
          {
            path: 'login/github/callback',
            element: <OAuthPage />
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);
