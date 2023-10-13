import ApplyTeamModal from '../ApplyTeamModal';
import { BsAwardFill, BsPeopleFill } from 'react-icons/bs';
import ProfileDropdown_Container from '../../ProfileDropdown';

export default function TeamOverview(props) {
  const { team } = props;

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
                <>
                  <BsAwardFill />
                  <ProfileDropdown_Container userName={team.leader_username} userId={team.leader_id} />
                </>
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
