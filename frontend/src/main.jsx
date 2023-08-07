import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import RootLayout from './routes/RootLayout';
import BoardPage from './routes/BoardPage';
import LoginPage from './routes/LoginPage';
import OAuthPage from './routes/OAuthPage';
import UserPage from './routes/UserPage';
import ChallengePage from './routes/ChallengePage';
import CommunityLayout from './routes/CommunityLayout';
import AccountsLayout from './routes/AccountsLayout';
import ArticlePage from './routes/ArticlePage';
import ArticleEdit from './components/Community/Article/ArticleEdit/ArticleEdit';
import SignUpPage from './routes/SignUpPage';
import { tokenLoader } from './utils/auth';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import StatisticsPage from './routes/StatisticsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    id: 'root',
    loader: tokenLoader,
    children: [
      {
        path: 'community',
        element: <CommunityLayout />,
        children: [
          {
            path: ':board_name',
            element: <BoardPage />
          },
          {
            path: 'article/:article_id',
            element: <ArticlePage />
          },
          {
            path: 'article/:article_id/edit',
            element: <ArticleEdit />
          },
          {
            path: 'challenge',
            element: <ChallengePage />
          }
        ]
      },
      {
        path: 'accounts',
        element: <AccountsLayout />,
        children: [
          {
            path: 'login',
            element: <LoginPage />
          },
          {
            path: 'login/github/callback',
            element: <OAuthPage />
          },
          {
            path: 'signup',
            element: <SignUpPage />
          }
        ]
      },
      {
        path: 'user',
        element: <UserPage />
      },
      {
        path: 'statistics',
        element: <StatisticsPage />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);
