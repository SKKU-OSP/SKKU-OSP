import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateTeamModal from '../CreateTeamModal';
import { getAuthConfig } from '../../../../utils/auth';
import { BsAwardFill, BsPeopleFill } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';
import AuthContext from '../../../../utils/auth-context';
import ProfileDropdown_Container from '../../ProfileDropdown';

const server_url = import.meta.env.VITE_SERVER_URL;

function MyTeamList() {
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState([]);
  const [maxPage, setMaxPage] = useState(0);
  const [nowPage, setNowPage] = useState(1);
  const [error, setError] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const { username } = useContext(AuthContext);

  const getMyTeamList = async (page) => {
    try {
      const responseTeamList = await axios.get(
        server_url + `/team/api/teams-of-user-list/?page_number=${page}`,
        getAuthConfig()
      );
      const resTeamList = responseTeamList.data;
      if (resTeamList.status === 'success') {
        setMyTeams(resTeamList.data.teams_of_user);
        setMaxPage(resTeamList.data.max_page_number);
        setNowPage(page);
      }
    } catch (error) {
      setError(true);
      console.log('error', error);
    }
  };

  useEffect(() => {
    console.log('username', username);
    if (username !== null) {
      getMyTeamList(1);
    } else {
      if (window.confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      }
      return;
    }
  }, [username]);

  const onPageChange = (page) => {
    getMyTeamList(page);
  };

  const handleShow = () => setModalShow(true);
  const handleClose = () => setModalShow(false);
  const btnWidth = '100px';

  return (
    <div className="col-9">
      <div className="community-team-nav d-flex">
        <div style={{ width: btnWidth }}></div>
        <ul className="nav nav-fill community-team-nav-items">
          <li className="community-team-nav-items">
            <div>내 팀 목록</div>
          </li>
        </ul>
        <button className="btn btn-primary" onClick={handleShow} style={{ width: btnWidth }}>
          팀 만들기
        </button>
        <CreateTeamModal show={modalShow} onClose={handleClose} />
      </div>

      {myTeams && myTeams.length > 0 ? (
        <>
          {myTeams.map((team) => (
            <div className="board-article" key={team.id}>
              <div>
                <Link className="board-article-title" to={`/community/team/${team.name}`}>
                  <h4 className="board-article-title">{team.name}</h4>
                </Link>
              </div>
              <div>
                <div className="inline-block">{team.description}</div>
                <div className="text-end">
                  {team.leader_username && (
                    <>
                      <BsAwardFill />
                      <ProfileDropdown_Container userName={team.leader_username} userId={team.leader_id} />
                    </>
                  )}
                  <BsPeopleFill />
                  {` ${team.member_cnt}명`}
                </div>
              </div>
            </div>
          ))}
          <Pagination
            activePage={nowPage}
            itemsCountPerPage={10}
            totalItemsCount={maxPage * 10}
            pageRangeDisplayed={5}
            onChange={onPageChange}
          />
        </>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </div>
  );
}

export default MyTeamList;
