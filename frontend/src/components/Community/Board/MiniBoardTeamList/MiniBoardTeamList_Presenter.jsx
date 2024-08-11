import '../Board.css';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import ProfileDropdown_Container from '../../ProfileDropdown';

export default function MiniBoardTeamList_Presenter(props) {
  const { team } = props;

  return (
    <div className="mini-board-article">
      {team.name ? (
        <>
          <div className="mini-board-article-header">
            <div className="mini-board-article-main" style={{ flexBasis: '15%' }}>
              <h6 className="mini-board-article-title">{team.name}</h6>
            </div>
            <div className="vertical-divider" style={{ height: '25px', margin: '0 3%' }}></div>
            <div className="mini-board-article-main" style={{ flexBasis: '60%' }}>
              <h6 className="mini-board-team-desc">{team.description}</h6>
            </div>
            <div className="mini-board-article-info" style={{ flexBasis: '25%' }}>
              <div className="mini-board-article-pubdate">
                <BsFillPatchCheckFill /> {team.leader_username}
                {/* <ProfileDropdown_Container userName={team.leader_username} userId={team.leader_id} style={{fontSize: '14px'}}/> */}
              </div>
            </div>
          </div>

          <div className="float-clear"></div>
        </>
      ) : (
        <h5>생성된 팀이 없습니다.</h5>
      )}
    </div>
  );
}
