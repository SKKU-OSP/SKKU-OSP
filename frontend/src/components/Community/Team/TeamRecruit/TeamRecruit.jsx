import CommunityNavItem from '../../Board/CommunityNavItem/index';
import TeamArticle from './TeamArticle';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuthConfig } from '../../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;

function TeamRecruit() {
  const navigate = useNavigate();
  const { board_name } = useParams();
  const [teams, setTeams] = useState([]);
  const [article, setArticle] = useState([]);
  const [error, setError] = useState(false);
  const board_names = ['팀 모집', '전체 팀 목록'];

  const onWrite = () => {
    navigate(`/community/${board_name}/register`);
  }

  const getArticle = async () => {
    try {
      const responseTeamList = await axios.get(server_url + `/team/api/teams-list/`);
      const responseRecruit = await axios.get(server_url + `/community/api/board/${board_name}/`, getAuthConfig());
      const resTeamList = responseTeamList.data;
      const resRecruit = responseRecruit.data;
      if (resTeamList.status === 'success') {
        setTeams(resTeamList.data.teams);
      }
      if (resRecruit.status === 'success') {
        setArticle(resRecruit.data.articles);
      }
    } catch (error) {
      setError(true);
    }
  };

  useEffect(() => {
    // 존재하는 게시판인지 확인
    if (!board_names.includes(board_name)) {
      alert('존재하지 않는 게시판입니다.');
      navigate('/community/board/팀 모집/recruit');
    } else {
      getArticle();
    }
  });

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <button className="primary-btn hidden">hidden</button>
        <ul className="nav nav-fill community-nav-items">
          <CommunityNavItem this_board_name="팀 모집" />
          <CommunityNavItem this_board_name="전체 팀 목록" />
        </ul>
        {board_name === "팀 모집" && (
          <button type="button" onClick={onWrite} className="btn btn-primary">
            작성하기
          </button>
        )}
        {board_name === "전체 팀 목록" && (
          <button className="primary-btn hidden">hidden</button>
        )}
      </div>

      {board_name === "팀 모집" && article && article.length > 0 ? (
        article.map(a => (
          <TeamArticle key={a.id} article={a} />
        ))
      ) : null}
      {board_name === "전체 팀 목록" && teams && teams.length > 0 ? (
        teams.map(a => (
          <TeamArticle key={a.id} article={a} />
        ))
      ) : null}
    </div>
  );
}

export default TeamRecruit;