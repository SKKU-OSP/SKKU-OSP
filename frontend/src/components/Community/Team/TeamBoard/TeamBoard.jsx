import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';
import TeamArticle from '../TeamRecruit/TeamArticle';
import InviteTeamModal from '../InviteTeamModal';
import EditTeamModal from '../EditTeamModal';
import { BsStarFill } from 'react-icons/bs';

const server_url = import.meta.env.VITE_SERVER_URL;

function TeamBoard() {
  const navigate = useNavigate();
  const { team_name } = useParams();
  const [thisTeam, setThisTeam] = useState({ team: {}, articles: [] });
  const [error, setError] = useState(false);

  const onMyTeamList = () => {
    navigate(`/community/board/내 팀 목록/myteam`);
  };

  const onWrite = () => {
    navigate(`/community/board/${thisTeam.board.name}/register/`);
  };

  const onWriter = (member) => {
    navigate(`/user/${member.member.user.username}`);
  };

  useEffect(() => {
    const getTeamInfo = async () => {
      try {
        const response = await axios.get(server_url + `/community/api/board/${team_name}/`, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setThisTeam(res.data);
        }
      } catch (error) {
        setError(true);
      }
    };
    getTeamInfo();
  }, [team_name]);

  console.log('team', thisTeam);
  console.log('img', thisTeam.team?.image);

  return (
    <>
      <div className="col-9">
        <div className="community-team-nav d-flex">
          <Button type="button" onClick={onMyTeamList} id="btn-content-back">
            내 팀 목록
          </Button>
          <ul className="nav nav-fill community-team-nav-items">
            <div>{team_name}</div>
          </ul>
          <Button type="button" onClick={onWrite} className="btn btn-primary">
            작성하기
          </Button>
        </div>
        <div className="team">
          <div className="team-left">
            <img
              src={thisTeam.team?.image}
              className="team-profile-img"
              alt="profile-image"
              data-bs-hover="tooltip"
              data-bs-placement="top"
              data-bs-title="프로필 페이지"
            />
            <div>
              <h4 className="team-description">
                {team_name}{' '}
                <EditTeamModal
                  team_name={thisTeam.team.name}
                  team_desc={thisTeam.team.description}
                  team_img={thisTeam.team.image}
                  team_members={thisTeam.team_members}
                  team_tags={thisTeam.team_tags}
                />
              </h4>
              <div>
                <h6 className="inline">{thisTeam.team.description}</h6>
              </div>
            </div>
          </div>
          <div className="team-right">
            <div>
              <h4 className="team-members">
                Members <InviteTeamModal />
              </h4>
              <div>
                {thisTeam.team_members
                  ? thisTeam.team_members.map((member) =>
                      member.is_admin ? (
                        <div key={member.member.user.id}>
                          <h6 className="team-members-list" onClick={() => onWriter(member)}>
                            <span>{member.member.user.username}</span>
                            <BsStarFill className="admin-star" />
                          </h6>
                        </div>
                      ) : (
                        <h6 className="team-members-list" onClick={() => onWriter(member)} key={member.member.user.id}>
                          {member.member.user.username}
                        </h6>
                      )
                    )
                  : null}
              </div>
            </div>
            <div>
              <button className="team-recommend-button multi-line-button">
                <span>팀 맞춤</span>
                <span>유저 추천</span>
              </button>
            </div>
          </div>
        </div>

        {thisTeam.articles && thisTeam.articles.length > 0
          ? thisTeam.articles.map((article) => <TeamArticle key={article.id} article={article} />)
          : null}
      </div>
    </>
  );
}

export default TeamBoard;
