import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CreateTeamModal from '../CreateTeamModal';
import { getAuthConfig } from '../../../../utils/auth';

const server_url = import.meta.env.VITE_SERVER_URL;

function MyTeamList() {
  const [myTeams, setMyTeams] = useState([]);
  const [error, setError] = useState(false);
  const [modalShow, setModalShow] = useState(false);

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

  const handleShow = () => setModalShow(true);
  const handleClose = () => setModalShow(false);
  const btnWidth = '100px';

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <div style={{ width: btnWidth }}></div>
        <ul className="nav nav-fill community-nav-items">
          <li className="nav-item selected-nav-item">
            <div>내 팀 목록</div>
          </li>
        </ul>
        <button className="btn btn-primary" onClick={handleShow} style={{ width: btnWidth }}>
          팀 만들기
        </button>
        <CreateTeamModal show={modalShow} onClose={handleClose} />
      </div>

      {myTeams && myTeams.length > 0
        ? myTeams.map((team) => (
            <div className="board-article" key={team.id}>
              <div>
                <Link className="board-article-title" to={`/community/team/${team.name}`}>
                  <h4 className="board-article-title">{team.name}</h4>
                </Link>
              </div>
              <div>
                <div className="inline-block">{team.description}</div>
                <div className="text-end">익명 외 몇 명</div>
              </div>
            </div>
          ))
        : null}
    </div>
  );
}

export default MyTeamList;
