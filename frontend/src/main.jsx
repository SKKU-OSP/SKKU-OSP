import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import RootLayout from './routes/RootLayout';
import LoginPage from './routes/LoginPage';
import OAuthPage from './routes/OAuthPage';
import UserPage from './routes/UserPage';
import DashBoard from './components/User/DashBoard/DashBoard';
import ChallengePage from './routes/ChallengePage';
import CommunityLayout from './routes/CommunityLayout';
import AccountsLayout from './routes/AccountsLayout';
import ArticlePage from './routes/ArticlePage';
import ArticleEdit from './components/Community/Article/ArticleEdit/ArticleEdit';
import ArticleRegister from './components/Community/Article/ArticleRegister/ArticleRegister';
import Board_Container from './components/Community/Board/index';
import SignUpPage from './routes/SignUpPage';
import RankUserPage from './routes/RankUserPage';
import RankRepoPage from './routes/RankRepoPage';

import { tokenLoader } from './utils/auth';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import StatisticsPage from './routes/StatisticsPage';
import UserActivity from './components/Community/Board/UserBoard/UserActivity';
import TeamRecruit from './components/Community/Team/TeamRecruit/TeamRecruit';
import MyTeamList from './components/Community/Team/TeamBoard/MyTeamList';
import TeamBoard from './components/Community/Team/TeamBoard/TeamBoard';
import Repository from './components/User/TinyUser/Repository';
import TeamApplication from './components/NavBar/TeamApplication/TeamApplication';
import RecommenderPage from './routes/RecommenderPage';
import SearchPage from './routes/SearchPage';
import HomePage from './routes/HomePage';
import DevAnalysis from './components/User/DashBoard/DevAnalysis';
import UserLayout from './components/User/UserLayout';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    element: <RootLayout />,
    id: 'root',
    loader: tokenLoader,
    children: [
      {
        path: 'community',
        element: <CommunityLayout />,
        children: [
          { path: '', element: <HomePage /> },
          {
            path: 'activity/:tabName',
            element: <UserActivity />
          },
          {
            path: 'board/:tabName',
            element: <Board_Container />
          },
          {
            path: 'recruit/:tabName',
            element: <TeamRecruit />
          },
          {
            path: 'myteam',
            element: <MyTeamList />
          },
          {
            path: 'team/:team_name',
            element: <TeamBoard />
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
        element: <UserLayout />,
        children: [
          { path: '', element: <UserPage /> },
          {
            path: 'profile',
            element: <UserPage />
          },
          {
            path: 'dashboard',
            element: <DashBoard />
          },
          {
            path: 'dev-type',
            element: <DevAnalysis />
          }
        ]
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
      },
      {
        path: 'rank/repo',
        element: <RankRepoPage />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);
