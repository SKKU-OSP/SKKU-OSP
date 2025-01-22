import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

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
import DevAnalysis from './components/User/TypeTest/DevAnalysis';
import TestType from './components/User/TypeTest/TestType';
import UserLayout from './components/User/UserLayout';
import AccountFind from './components/Account/AccountFind';
import AccountFindDone from './components/Account/AccountFindDone';
import PasswordResetSend from './components/Account/PasswordResetSend';
import PasswordResetSendDone from './components/Account/PasswordResetSendDone';
import PasswordResetConfirm from './components/Account/PasswordResetConfirm';
import PasswordResetComplete from './components/Account/PasswordResetComplete';
import MainBoard_Container from './components/Community/Board/MainBoard/MainBoard_Container';
import QnAPage from './routes/QnAPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

const GaTrackingId = import.meta.env.VITE_GA_TRACKING_ID;
ReactGA.initialize(GaTrackingId);

const GAListner = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    ReactGA.set({ page: location.pathname });
    ReactGA.send('pageview');
  }, [location]);

  return children;
};

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
            path: 'main',
            element: <MainBoard_Container />
          },
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
            path: 'team',
            element: <MyTeamList />
          },
          {
            path: 'team/:team_name',
            element: <TeamBoard />
          },
          {
            path: 'board/:board_name/register', //커뮤니티 게시글 등록
            element: <ArticleRegister />
          },
          {
            path: 'recruit/:board_name/register', //팀 모집 게시판 게시글 등록
            element: <ArticleRegister />
          },
          {
            path: 'team/:board_name/register', //팀 게시판 게시글 등록
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
          },
          {
            path: 'find',
            element: <AccountFind />
          },
          {
            path: 'find/done',
            element: <AccountFindDone />
          },
          {
            path: 'password-reset',
            element: <PasswordResetSend />
          },
          {
            path: 'password-reset/done',
            element: <PasswordResetSendDone />
          },
          {
            path: 'reset/:uidb64/:token',
            element: <PasswordResetConfirm />
          },
          {
            path: 'reset/done',
            element: <PasswordResetComplete />
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
          },
          {
            path: 'dev-type/test',
            element: <TestType />
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
      },
      {
        path: 'qna',
        element: <QnAPage />
      }
    ]
  }
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router}>
      <GAListner />
    </RouterProvider>
  </QueryClientProvider>
);
