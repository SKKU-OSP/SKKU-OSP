import CommunityNavItem from '../../Board/CommunityNavItem/index';
import TeamArticle from '../TeamRecruit/TeamArticle';
import axios from 'axios';
import { useEffect, useState } from 'react';
import CreateTeamModal from '../CreateTeamModal';
import { getAuthConfig } from '../../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;

function MyTeamList() {
  const [myTeams, setMyTeams] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const getMyTeamList = async () => {
      try {
        const responseTeamList = await axios.get(server_url + `/team/api/teams-of-user-list/`, getAuthConfig());
        const resTeamList = responseTeamList.data;
        if (resTeamList.status === 'success') {
          setMyTeams(resTeamList.data.teams_of_user);
        }
      } catch (error) {
        setError(true);
        console.log('error', error);
      }
    };
    getMyTeamList();
  }, []);

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <button className="primary-btn hidden">hidden</button>
        <ul className="nav nav-fill community-nav-items">
          <CommunityNavItem this_board_name="내 팀 목록" />
        </ul>
        <CreateTeamModal />
      </div>

      {myTeams && myTeams.length > 0 ? myTeams.map((a) => <TeamArticle key={a.id} article={a} />) : null}
    </div>
  );
}

export default MyTeamList;
