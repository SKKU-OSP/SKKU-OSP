import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthConfig } from '../../../utils/auth';
import axios from 'axios';
import Recommender_Presenter from './Recommender_Presenter';

const server_url = import.meta.env.VITE_SERVER_URL;
const url = server_url + '/team/api/recommender/users/';
function Recommender_Container() {
  const [teams, setTeams] = useState();
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState();
  const [teamMembers, setTeamMembers] = useState();

  useEffect(() => {
    const getTeam = async () => {
      try {
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setTeams(res.data.teams);
          setSelectedTeam(res.data.teams[0]);
        }
      } catch (error) {
        console.log('getTeam', error);
        setIsReady(true);
        setError('팀을 불러오는데 실패했습니다.');
      }
    };
    setError(null);
    getTeam();
  }, []);

  useEffect(() => {
    const getTeamMember = async (team_id) => {
      try {
        const response = await axios.get(url, {
          ...getAuthConfig(),
          params: {
            team_id: team_id
          }
        });
        const res = response.data;
        if (res.status === 'success') {
          setTeamMembers(res.data.recommend.sort((a, b) => b.value - a.value));
          setIsReady(true);
        }
      } catch (error) {
        console.log('getTeamMember', error);
        setIsReady(true);
        setError('팀원을 불러오는데 실패했습니다.');
      }
    };
    if (selectedTeam) getTeamMember(selectedTeam.id);
  }, [selectedTeam]);

  const navigate = useNavigate();

  const onMyProfile = (username) => {
    navigate('/user/' + username);
  };
  const handleItemClick = (team) => {
    setSelectedTeam(team);
    setTeamMembers();
  };

  return (
    <>
      {teams && selectedTeam && (
        <>
          {' '}
          {teams.length > 0 ? (
            <Recommender_Presenter
              teams={teams}
              onMyProfile={onMyProfile}
              handleItemClick={handleItemClick}
              selectedTeam={selectedTeam}
              teamMembers={teamMembers}
              isReady={isReady}
              error={error}
            />
          ) : (
            <div className="mx-auto mt-5">팀이 없습니다.</div>
          )}
        </>
      )}
    </>
  );
}
export default Recommender_Container;
