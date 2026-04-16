import { useEffect, useRef, useState } from 'react';
import ApplyTeamModal from '../ApplyTeamModal';
import { BsFillPatchCheckFill, BsPeopleFill } from 'react-icons/bs';
import ProfileDropdown_Container from '../../ProfileDropdown';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function TeamOverview(props) {
  const { team } = props;
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;

    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '0');
    const maxHeight = lineHeight * 2 + 0.5; // 2줄 높이 + 오차 보정
    setIsClamped(el.scrollHeight > maxHeight);
  }, [team?.description]);

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
                <h6
                  ref={descRef}
                  className={`board-team-desc-text ${isClamped && !expanded ? 'clamped' : ''}`}
                  title={team.description || ''}
                >
                  {team.description}
                </h6>
                {isClamped && (
                  <button
                    type="button"
                    className="board-team-desc-toggle"
                    onClick={() => setExpanded((prev) => !prev)}
                    aria-label={expanded ? '접기' : '전체 내용 보기'}
                  >
                    {expanded ? '▲' : '▼'}
                  </button>
                )}
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
