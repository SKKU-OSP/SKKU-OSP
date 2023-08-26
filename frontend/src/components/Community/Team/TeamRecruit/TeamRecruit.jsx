import CommunityNavItem from '../../Board/CommunityNavItem/index';
import TeamArticle from './TeamArticle';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuthConfig } from '../../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;

function TeamRecruit() {
  const navigate = useNavigate();
  const { tabName } = useParams();
  const [teams, setTeams] = useState([]);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(false);

  const onWrite = () => {
    navigate(`/community/${tabName}/register`);
  };

  useEffect(() => {
    const getRecruit = async () => {
      try {
        const responseRecruit = await axios.get(server_url + `/community/api/board/${tabName}/`, getAuthConfig());
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
    if (tabName === '팀 모집') {
      getRecruit();
    } else if (tabName === '전체 팀 목록') {
      getTeamList();
    } else {
      alert('존재하지 않는 게시판입니다.');
    }
  }, [tabName]);

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <button className="hidden">hidden</button>
        <ul className="nav nav-fill community-nav-items">
          <CommunityNavItem navName="팀 모집" tabName={tabName} />
          <CommunityNavItem navName="전체 팀 목록" tabName={tabName} />
        </ul>
        {tabName === '팀 모집' && (
          <button type="button" onClick={onWrite} className="btn btn-primary">
            작성하기
          </button>
        )}
        {tabName === '전체 팀 목록' && <button className="hidden">hidden</button>}
      </div>

      {tabName === '팀 모집' && articles.length > 0
        ? articles.map((a) => <TeamArticle key={a.id} article={a} />)
        : null}
      {tabName === '전체 팀 목록' && teams && teams.length > 0
        ? teams.map((a) => <TeamArticle key={a.id} article={a} />)
        : null}
    </div>
  );
}

export default TeamRecruit;
