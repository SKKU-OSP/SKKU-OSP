import { useNavigate } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ApplyTeamModal from '../ApplyTeamModal';
import { BsStarFill, BsPeopleFill } from 'react-icons/bs';

export default function TeamOverview(props) {
  const { team } = props;
  const navigate = useNavigate();

  return (
    <div className="board-article">
      <div>
        <h4 className="board-team-title">{team.name}</h4>
        <div className="board-article-modal">
          <ApplyTeamModal />
        </div>
      </div>
      <div>
        <h6 className="inline-block">{team.description}</h6>
        <div className="text-end">
          {team.leader && (
            <span className="dropdown-button">
              <BsStarFill />
              <DropdownButton title={team.leader} variant="link" className="dropdown-toggle">
                <Dropdown.Item
                  onClick={() => {
                    navigate(`/user/${team.leader}`);
                  }}
                >
                  프로필
                </Dropdown.Item>
                <Dropdown.Item>메세지</Dropdown.Item>
              </DropdownButton>
            </span>
          )}
          <BsPeopleFill />
          {` ${team.member_cnt}명`}
        </div>
      </div>
    </div>
  );
}
