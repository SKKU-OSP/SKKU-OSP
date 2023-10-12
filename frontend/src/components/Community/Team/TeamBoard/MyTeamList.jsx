import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateTeamModal from '../CreateTeamModal';
import { getAuthConfig } from '../../../../utils/auth';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { BsAwardFill, BsPeopleFill } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import AuthContext from '../../../../utils/auth-context';
import ChatMessageModal_Container from '../../../NavBar/Chat/ChatMessageModal_Container';

const server_url = import.meta.env.VITE_SERVER_URL;

function MyTeamList() {
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState([]);
  const [error, setError] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  const { username } = useContext(AuthContext);
  const [showChatMessageModal, setShowChatMessageModal] = useState(false);

  const onCloseChatModal = () => {
    setShowChatMessageModal(false);
  };

  const onChatMessage = () => {
    setShowChatMessageModal(true);
  };

  const handleLogin = async () => {
    if (!username) {
      const shouldNavigate = await new Promise((resolve) => {
        const confirmation = window.confirm('로그인해야 이용할 수 있는 기능입니다. 로그인 화면으로 이동하시겠습니까?');
        resolve(confirmation);
      });

      if (shouldNavigate) {
        navigate('/accounts/login');
      }
    }
  };

  useEffect(() => {
    handleLogin();
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
        myTeams.map((team) => (
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
                  <span className="dropdown-button">
                    <BsAwardFill />
                    <DropdownButton
                      title={team.leader_username}
                      variant="link"
                      className="dropdown-toggle"
                      style={{ marginRight: '10px' }}
                    >
                      <Dropdown.Item
                        onClick={() => {
                          navigate(`/user/${team.leader_username}`);
                        }}
                      >
                        프로필
                      </Dropdown.Item>
                      {username != team.leader_username && (
                        <>
                          <Dropdown.Item onClick={onChatMessage}>메시지</Dropdown.Item>
                          <ChatMessageModal_Container
                            show={showChatMessageModal}
                            onCloseChatModal={onCloseChatModal}
                            targetId={team.leader_id}
                          />
                        </>
                      )}
                    </DropdownButton>
                  </span>
                )}
                <BsPeopleFill />
                {` ${team.member_cnt}명`}
              </div>
            </div>
          </div>
        ))
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </div>
  );
}

export default MyTeamList;
