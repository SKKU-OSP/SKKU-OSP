import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';
import TeamArticle from './TeamArticle';
import InviteTeamModal from '../InviteTeamModal';
import EditTeamModal from '../EditTeamModal';
import { BsAwardFill } from 'react-icons/bs';
import AuthContext from '../../../../utils/auth-context';
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';

const server_url = import.meta.env.VITE_SERVER_URL;

function TeamBoard() {
  const navigate = useNavigate();
  const { team_name } = useParams();
  const [isLoadedArticles, setIsLoadedArticles] = useState(false);
  const [maxPageNumber, setMaxPageNumber] = useState(0);
  const [nowPage, setNowPage] = useState(1);
  const [thisTeam, setThisTeam] = useState({ team: {}, articles: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(false);
  const { username } = useContext(AuthContext);

  const getTeamInfo = async (page) => {
    try {
      const response = await axios.get(
        server_url + `/community/api/board/${team_name}/?page_number=${page}`,
        getAuthConfig()
      );
      const res = response.data;
      if (res.status === 'success') {
        setThisTeam(res.data);
        setMaxPageNumber(res.data.max_page_number);
        setIsLoadedArticles(true);
        setNowPage(page);
        console.log('page', maxPageNumber, nowPage);
        const userMemberInfo = res.data.team_members.find((ele) => ele.member.user.username === username);
        setIsAdmin(userMemberInfo?.is_admin);
      }
    } catch (error) {
      setError(true);
    }
  };

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

  const onPageChange = (page) => {
    getTeamInfo(page);
  };

  useEffect(() => {
    if (username !== null) {
      getTeamInfo(1);
    }
  }, [team_name, username]);

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
        {isLoadedArticles ? (
          <>
            <div className="team">
              <div className="team-left">
                <img
                  src={server_url + thisTeam.team.image}
                  className="team-profile-img"
                  data-bs-hover="tooltip"
                  data-bs-placement="top"
                  data-bs-title="프로필 페이지"
                />
                <div>
                  <div className="team-description fs-4">
                    {team_name}
                    {isAdmin ? <EditTeamModal team_name={team_name} /> : null}
                    {/* <EditTeamModal team_name={team_name} /> */}
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
                                <BsAwardFill className="admin-star" />
                              </h6>
                            </div>
                          ) : (
                            <h6
                              className="team-members-list"
                              onClick={() => onWriter(member)}
                              key={member.member.user.id}
                            >
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

            {thisTeam.articles && thisTeam.articles.length > 0 ? (
              thisTeam.articles.map((article) => <TeamArticle key={article.id} article={article} />)
            ) : (
              <h5>작성된 글이 없습니다.</h5>
            )}
            <Pagination
              activePage={nowPage}
              itemsCountPerPage={10}
              totalItemsCount={maxPageNumber * 10}
              pageRangeDisplayed={5}
              onChange={onPageChange}
            ></Pagination>
          </>
        ) : (
          <LoaderIcon style={{ marginTop: '20px' }} />
        )}
      </div>
    </>
  );
}

export default TeamBoard;
