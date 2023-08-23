import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import RootLayout from './routes/RootLayout';
import LoginPage from './routes/LoginPage';
import OAuthPage from './routes/OAuthPage';
import UserPage from './routes/UserPage';
import ChallengePage from './routes/ChallengePage';
import CommunityLayout from './routes/CommunityLayout';
import AccountsLayout from './routes/AccountsLayout';
import ArticlePage from './routes/ArticlePage';
import ArticleEdit from './components/Community/Article/ArticleEdit/ArticleEdit';
import ArticleRegister from './components/Community/Article/ArticleRegister/ArticleRegister';
import Board_Container from './components/Community/Board/index';
import SignUpPage from './routes/SignUpPage';
import RankUserPage from './routes/RankUserPage';
import { tokenLoader } from './utils/auth';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import StatisticsPage from './routes/StatisticsPage';

import Repository from './components/User/TinyUser/Repository';
import TeamApplication from './components/NavBar/TeamApplication/TeamApplication';
import RecommenderPage from './routes/RecommenderPage';
import SearchPage from './routes/SearchPage';

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
            path: 'board/:board_name',
            element: <Board_Container />
          },
          {
            path: 'board/:board_name/register',
            element: <ArticleRegister />
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
          },
          {
            path: 'TeamApplication',
            element: <TeamApplication />
          },
          {
            path: 'recommender',
            element: <RecommenderPage />
          },
          {
            path: 'search',
            element: <SearchPage />
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
        path: 'user/:username',
        element: <UserPage />
      },
      {
        path: 'repository/:username',
        element: <Repository />
      },
      {
        path: 'statistics',
        element: <StatisticsPage />
      },
      {
        path: 'rank/user',
        element: <RankUserPage />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);
