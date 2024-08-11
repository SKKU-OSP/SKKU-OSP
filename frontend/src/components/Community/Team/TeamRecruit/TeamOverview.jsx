import ApplyTeamModal from '../ApplyTeamModal';
import { BsFillPatchCheckFill, BsPeopleFill } from 'react-icons/bs';
import ProfileDropdown_Container from '../../ProfileDropdown';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function TeamOverview(props) {
  const { team } = props;

  return (
    <div className="board-team-article">
      {team.name ? (
        <>
          <div className="board-article-header">
            <div className="board-team">
              <img src={server_url + team.image} className="board-team-img" />
              <h5 className="board-team-name" style={{ fontWeight: 'bold' }}>
                {team.name}
              </h5>
              <div className="vertical-divider"></div>
              <div className="board-team-desc">
                <h6 className="board-team-desc-text">{team.description}</h6>
              </div>
            </div>
            <div className="board-article-team-info">
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

          <div className="board-team-recruit">
            <div className="board-article-modal">
              <ApplyTeamModal />
            </div>
          </div>
        </>
      ) : (
        <h5>팀이 없습니다.</h5>
      )}
    </div>
  );
}
