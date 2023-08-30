import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import CommunityNavItem from '../../Board/CommunityNavItem/index';
import TeamOverview from './TeamOverview';
import RecruitArticle from './RecruitArticle';
import AuthContext from '../../../../utils/auth-context';

const server_url = import.meta.env.VITE_SERVER_URL;

function TeamRecruit() {
  const navigate = useNavigate();
  const { tabName } = useParams();
  const { username } = useContext(AuthContext);

  const [teams, setTeams] = useState([]);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(false);

  const isRecruitTab = tabName === '팀 모집';
  const isTeamListTab = tabName === '전체 팀 목록';

  useEffect(() => {
    const getRecruit = async () => {
      try {
        const responseRecruit = await axios.get(server_url + `/community/api/board/${tabName}/`);
        const resRecruit = responseRecruit.data;
        if (resRecruit.status === 'success') {
          setArticles(resRecruit.data.articles);
        }
      } catch (error) {
        setError(true);
        console.log('getRecruit error', error);
      }
    };
    const getTeamList = async () => {
      try {
        const responseTeamList = await axios.get(server_url + `/team/api/teams-list/`);
        const resTeamList = responseTeamList.data;
        if (resTeamList.status === 'success') {
          setTeams(resTeamList.data.teams);
        }
      } catch (error) {
        setError(true);
        console.log('getTeamList error', error);
      }
    };
    // 존재하는 게시판인지 확인
    if (isRecruitTab) {
      getRecruit();
    } else if (isTeamListTab) {
      getTeamList();
    } else {
      alert('존재하지 않는 게시판입니다.');
    }
  }, [tabName, isRecruitTab, isTeamListTab]);

  const onWrite = () => {
    if (username) {
      navigate(`/community/${tabName}/register`);
    } else {
      if (confirm('로그인이 필요합니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate(`/accounts/login`);
      }
    }
  };

  const hiddenWidth = isRecruitTab ? '100px' : '0';

  return (
    <div className="col-9">
      {!error && (
        <>
          <div className="community-nav d-flex">
            <div style={{ width: hiddenWidth }}></div>
            <ul className="nav nav-fill community-nav-items">
              <CommunityNavItem navName="팀 모집" tabName={tabName} />
              <CommunityNavItem navName="전체 팀 목록" tabName={tabName} />
            </ul>
            {isRecruitTab && (
              <button type="button" onClick={onWrite} className="btn btn-primary" style={{ width: hiddenWidth }}>
                작성하기
              </button>
            )}
            {isTeamListTab && <div style={{ width: hiddenWidth }}></div>}
          </div>
          {isRecruitTab && articles.map((article) => <RecruitArticle key={article.id} article={article} />)}
          {isTeamListTab && teams.map((team) => <TeamOverview key={team.id} team={team} />)}
        </>
      )}
      {error && <div>문제가 발생했습니다</div>}
    </div>
  );
}

export default TeamRecruit;
