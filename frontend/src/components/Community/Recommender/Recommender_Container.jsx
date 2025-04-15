import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthConfig } from '../../../utils/auth';
import axios from 'axios';
import styles from './Recommender.module.css';
import Recommender_Presenter from './Recommender_Presenter';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import LoaderIcon from 'react-loader-icon';

const server_url = import.meta.env.VITE_SERVER_URL;
const url = server_url + '/team/api/recommender/users/';

function Recommender_Container() {
  const [teams, setTeams] = useState();
  const [selectedTeam, setSelectedTeam] = useState();
  const [teamMembers, setTeamMembers] = useState();
  const location = useLocation();
  const navigate = useNavigate();

  const handleError = (message, url) => {
    alert(message);
    navigate(url);
  };

  useEffect(() => {
    const team_name = location.state?.team_name;
    const getTeam = async () => {
      try {
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setTeams(res.data.teams);
          const teamToSelect = team_name ? res.data.teams.find((team) => team.name === team_name) : res.data.teams[0];
          setSelectedTeam(teamToSelect);
        } else {
          handleError(res.message + ' 로그인 화면으로 이동합니다.', '/accounts/login');
        }
      } catch (error) {
        handleError(error.message + ' 홈 화면으로 이동합니다.', '/');
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
          setTeamMembers(res.data.recommend.sort((a, b) => b.value - a.value));
        }
      } catch (error) {
        handleError(error.message + ' 홈 화면으로 이동합니다.', '/');
      }
    };
    if (selectedTeam) getTeamMember(selectedTeam.id);
  }, [selectedTeam]);

  const onMyProfile = (username) => {
    navigate('/user/' + username);
  };
  const handleItemClick = (team) => {
    setSelectedTeam(team);
    setTeamMembers();
  };
  return (
    <div className="col-9">
      {teams ? (
        <>
          <div className={styles.recommendBar}>
            <DropdownButton id="dropdown-basic-button" title={selectedTeam.name} variant="secondary">
              {teams.map((team) => (
                <Dropdown.Item onClick={() => handleItemClick(team)} key={team.id}>
                  {team.name}
                </Dropdown.Item>
              ))}
            </DropdownButton>
            <span className={styles.recommendTitle}>&apos;{selectedTeam.name}&apos;팀 맞춤 유저 추천</span>
            <DropdownButton
              id="dropdown-basic-button"
              title={selectedTeam.name}
              variant="secondary"
              style={{ visibility: 'hidden' }}
            >
              {teams.map((team) => {
                <Dropdown.Item onClick={() => handleItemClick(team.id)} key={team.id}>
                  {team.name}
                </Dropdown.Item>;
              })}
            </DropdownButton>
          </div>
          {selectedTeam && teams.length > 0 ? (
            teamMembers ? (
              <Recommender_Presenter onMyProfile={onMyProfile} teamMembers={teamMembers} />
            ) : (
              <LoaderIcon style={{ marginTop: '20px' }} />
            )
          ) : (
            <div className="mx-auto mt-5">팀이 없습니다.</div>
          )}
        </>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </div>
  );
}
export default Recommender_Container;
