import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ApplyTeamModal from '../ApplyTeamModal';
import { BsAwardFill, BsPeopleFill } from 'react-icons/bs';
import AuthContext from '../../../../utils/auth-context';
import ChatMessageModal_Container from '../../../NavBar/Chat/ChatMessageModal_Container';

export default function TeamOverview(props) {
  const { team } = props;
  const navigate = useNavigate();
  const { username } = useContext(AuthContext);
  const [showChatMessageModal, setShowChatMessageModal] = useState(false);

  const onCloseChatModal = () => {
    setShowChatMessageModal(false);
  };

  const onChatMessage = () => {
    setShowChatMessageModal(true);
  };

  return (
    <div className="board-article">
      {team.name ? (
        <>
          <div>
            <h4 className="board-team-title">{team.name}</h4>
            <div className="board-article-modal">
              <ApplyTeamModal />
            </div>
          </div>
          <div>
            <h6 className="inline-block">{team.description}</h6>
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
        </>
      ) : (
        <h5>팀이 없습니다.</h5>
      )}
    </div>
  );
}
