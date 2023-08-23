import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthConfig } from '../../../utils/auth';
import axios from 'axios';
import Recommender_Presenter from './Recommender_Presenter';
import Spinner from 'react-bootstrap/Spinner';
function Recommender_Container() {
  const [teams, setTeams] = useState();
  const [error_occur, setError] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState();
  const [teamMembers, setTeamMember] = useState();
  const server_url = import.meta.env.VITE_SERVER_URL;
  const url = server_url + '/team/api/recommender/users/';
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
        setError(true);
      }
    };
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
          setTeamMember(res.data.recommend.sort((a, b) => b.value - a.value));
        }
      } catch (error) {
        console.log(error);
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
    setTeamMember();
  };
  return (
    <>
      {teams && selectedTeam ? (
        <>
          {' '}
          {teams.length > 0 ? (
            <Recommender_Presenter
              teams={teams}
              onMyProfile={onMyProfile}
              handleItemClick={handleItemClick}
              selectedTeam={selectedTeam}
              teamMembers={teamMembers}
            />
          ) : (
            <>팀이 없습니다.</>
          )}
        </>
      ) : (
        <Spinner animation="border" style={{ position: 'absolute', top: '50%', left: '50%' }} />
      )}
    </>
  );
}
export default Recommender_Container;
