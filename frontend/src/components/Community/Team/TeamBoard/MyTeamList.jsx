import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateTeamModal from '../CreateTeamModal';
import { getAuthConfig } from '../../../../utils/auth';
import { BsFillPatchCheckFill, BsPeopleFill } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';
import Dropdown from 'react-bootstrap/Dropdown';
import AuthContext from '../../../../utils/auth-context';
import ProfileDropdown_Container from '../../ProfileDropdown';

const server_url = import.meta.env.VITE_SERVER_URL;

function MyTeamList() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [maxPage, setMaxPage] = useState(0);
  const [nowPage, setNowPage] = useState(1);
  const [error, setError] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const { username } = useContext(AuthContext);

  const [sortOrder, setSortOrder] = useState('-id');

  const sortOptions = [
    { label: '최신순', value: '-id' },
    { label: '오래된 순', value: 'id' },
    { label: '이름 순', value: 'name' },
    { label: '팀원 많은 순', value: '-member_cnt' }
  ];

  const [showDropDown, setShowDropDown] = useState(false);

  const getMyTeamList = async (page, sort = sortOrder) => {
    try {
      const responseTeamList = await axios.get(
        server_url + `/team/api/teams-of-user-list/?page_number=${page}&sort=${sort}`,
        getAuthConfig()
      );
      const resTeamList = responseTeamList.data;
      if (resTeamList.status === 'success') {
        setMyTeams(resTeamList.data.teams_of_user);
        setMaxPage(resTeamList.data.max_page_number);
        setNowPage(page);
        setIsReady(true);
      }
    } catch (error) {
      setIsReady(true);
      setError(true);
      console.log('error', error);
    }
  };

  useEffect(() => {
    if (username !== null) {
      getMyTeamList(1, sortOrder);
    } else {
      if (window.confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate('/accounts/login');
      }
      return;
    }
  }, [username, sortOrder]);

  const onPageChange = (page) => {
    getMyTeamList(page, sortOrder);
    setNowPage(page);
  };

  const handleSortChange = (sortOption) => {
    setSortOrder(sortOption.value);
    getMyTeamList(nowPage, sortOption.value);
    setShowDropDown(false);
  };

  const handleShow = () => setModalShow(true);
  const handleClose = () => setModalShow(false);
  const btnWidth = '100px';

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <ul className="nav nav-fill community-nav-items">
          <li className="nav-item selected-nav-item">
            <div style={{ cursor: 'default' }}>내 팀 목록</div>
          </li>
        </ul>
        <ul className="nav nav-fill">
          <Dropdown
            className="community-dropdown"
            show={showDropDown}
            onToggle={(isOpen) => setShowDropDown(isOpen)}
            style={{ marginRight: '5px' }}
          >
            <Dropdown.Toggle variant="secondary" id="dropdown-sort">
              {sortOptions.find((option) => option.value === sortOrder).label}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {sortOptions.map((option) => (
                <Dropdown.Item key={option.value} onClick={() => handleSortChange(option)}>
                  {option.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <button className="btn btn-primary" onClick={handleShow}>
            <BsPeopleFill style={{ marginRight: '7px', marginBottom: '5px' }} />팀 만들기
          </button>
          <CreateTeamModal show={modalShow} onClose={handleClose} />
        </ul>
      </div>

      {isReady ? (
        <>
          {myTeams.length > 0 ? (
            myTeams.map((team) => (
              <div className="board-team-article" key={team.id}>
                <div className="board-article-header">
                  <div className="board-team">
                    <img src={server_url + team.image} className="board-team-img" />
                    <Link
                      className="board-team-name link"
                      style={{ fontWeight: 'bold' }}
                      to={`/community/team/${team.name}`}
                    >
                      <h5 style={{ fontWeight: 'bold' }}>{team.name}</h5>
                    </Link>
                    <div className="vertical-divider"></div>
                    <div className="board-team-desc">
                      <h6 className="board-team-desc-text">{team.description}</h6>
                    </div>
                  </div>
                  <div className="board-article-info" style={{ flexBasis: '30%' }}>
                    <div className="board-team-leader">
                      {team.leader_username && (
                        <>
                          <BsFillPatchCheckFill style={{ marginRight: '10px' }} />
                          <ProfileDropdown_Container userName={team.leader_username} userId={team.leader_id} />
                        </>
                      )}
                    </div>
                    <div className="board-team-member">
                      <BsPeopleFill style={{ marginRight: '5px' }} />
                      {` ${team.member_cnt}명`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div>소속된 팀이 없습니다.</div>
          )}
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
