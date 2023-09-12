import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';
import TeamArticle from './TeamArticle';
import InviteTeamModal from '../InviteTeamModal';
import EditTeamModal from '../EditTeamModal';
import { BsStarFill } from 'react-icons/bs';
import AuthContext from '../../../../utils/auth-context';

const server_url = import.meta.env.VITE_SERVER_URL;

function TeamBoard() {
  const navigate = useNavigate();
  const { team_name } = useParams();
  const [thisTeam, setThisTeam] = useState({ team: {}, articles: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(false);
  const { username } = useContext(AuthContext);

  const onMyTeamList = () => {
    navigate(`/community/myteam`);
  };

  const onWrite = () => {
    navigate(`/community/board/${thisTeam.board.name}/register/`);
  };

  const onWriter = (member) => {
    navigate(`/user/${member.member.user.username}`);
  };

  const onRecommender = () => {
    navigate(`/community/recommender`);
  };

  useEffect(() => {
    const getTeamInfo = async () => {
      try {
        const response = await axios.get(server_url + `/community/api/board/${team_name}/`, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setThisTeam(res.data);
          const userMemberInfo = res.data.team_members.find((ele) => ele.member.user.username === username);
          setIsAdmin(userMemberInfo?.is_admin);
        }
      } catch (error) {
        setError(true);
      }
    };
    if (username !== null) getTeamInfo();
  }, [team_name]);

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
              src={thisTeam.team.image}
              className="team-profile-img"
              alt="profile-image"
              data-bs-hover="tooltip"
              data-bs-placement="top"
              data-bs-title="프로필 페이지"
            />
            <div>
              <div className="team-description fs-4">
                {team_name}
                {isAdmin ? <EditTeamModal team_name={team_name} /> : null}
              </div>
              <div>
                <div className="inline fs-6">{thisTeam.team.description}</div>
              </div>
            </div>
          </div>
          <div className="team-right">
            <div>
              <div className="team-members fs-4">
                Members
                <InviteTeamModal />
              </div>
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
              <button className="team-recommend-button multi-line-button" onClick={onRecommender}>
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
