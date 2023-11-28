import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';
import TeamArticle from './TeamArticle';
import EditTeamModal from '../EditTeamModal';
import { BsAwardFill, BsBoxArrowRight, BsPersonPlusFill, BsPencilFill } from 'react-icons/bs';
import AuthContext from '../../../../utils/auth-context';
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ChatMessageModal_Container from '../../../NavBar/Chat/ChatMessageModal_Container';
import InviteTeamModalInBoard from '../InviteTeamModalInBoard';
import classes from './TeamBoard.module.css';

const server_url = import.meta.env.VITE_SERVER_URL;

function TeamBoard() {
  const navigate = useNavigate();
  const { team_name } = useParams();
  const [isLoadedArticles, setIsLoadedArticles] = useState(false);
  const [inviteId, setInviteId] = useState(0);
  const [maxPageNumber, setMaxPageNumber] = useState(0);
  const [nowPage, setNowPage] = useState(1);
  const [thisTeam, setThisTeam] = useState({ team: {}, articles: [] });
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamTags, setTeamTags] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myId, setMyId] = useState(0);
  const [error, setError] = useState(false);
  const { username } = useContext(AuthContext);
  const [showChatMessageModal, setShowChatMessageModal] = useState(false);

  const [showInvite, setShowInvite] = useState(false);

  const inviteURL = server_url + '/team/api/team-invite-update/';

  const getTeamInfo = async (page) => {
    try {
      setIsLoadedArticles(false);
      const response = await axios.get(
        server_url + `/community/api/board/${team_name}/?page_number=${page}`,
        getAuthConfig()
      );
      const res = response.data;
      if (res.status === 'success') {
        console.log(res.data);
        setThisTeam(res.data);
        setTeamMembers(res.data.team_members);
        setTeamTags(res.data.team_tags);
        setMaxPageNumber(res.data.max_page_number);
        setIsLoadedArticles(true);
        setNowPage(page);
        setInviteId(res.data.invite_id);
        setMyId(res.data.privacy.account);
        const userMemberInfo = res.data.team_members.find((ele) => ele.member.user.username === username);
        setIsAdmin(userMemberInfo?.is_admin);
      } else {
        setError(res.message);
        setIsLoadedArticles(true);
      }
    } catch (error) {
      setError(true);
      setIsLoadedArticles(true);
    }
  };
  const sendInviteResult = async (id, userId, status) => {
    try {
      const data = { target_teaminvitemessage_id: id, is_okay: status, user_id: userId };
      const response = await axios.post(inviteURL, data, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        console.log(res.status, res.errors);
      } else {
        console.log(res.data);
        navigate(`/community/team`);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleApproveClick = (InviteId, userId) => {
    sendInviteResult(InviteId, userId, 'true');
    alert('성공적으로 팀의 멤버가 되었습니다.');
  };

  const handleRefuseClick = (InviteId, userId) => {
    sendInviteResult(InviteId, userId, 'false');
    alert('성공적으로 초대를 거절하였습니다.');
  };
  const onMyTeamList = () => {
    navigate(`/community/team`);
  };

  const onWrite = () => {
    navigate(`/community/board/${thisTeam.board.name}/register/`);
  };

  const onRecommender = () => {
    navigate(`/community/recommender`, { state: { team_name } });
  };

  const onPageChange = (page) => {
    getTeamInfo(page);
  };

  const onCloseChatModal = () => {
    setShowChatMessageModal(false);
  };

  const onChatMessage = () => {
    setShowChatMessageModal(true);
  };

  const teamOut = async () => {
    const currentUser = username;
    console.log('current', currentUser);

    if (teamMembers.length < 2) {
      if (window.confirm('팀을 탈퇴하면 팀이 삭제됩니다. 그래도 진행하시겠습니까?')) {
        postTeamOut();
      }
    } else {
      if (window.confirm('팀을 탈퇴하시겠습니까?')) {
        postTeamOut();
      }
    }
  };

  const postTeamOut = async () => {
    try {
      const data = { team_name: team_name };
      const response = await axios.post(server_url + `/team/api/team-out/`, data, getAuthConfig());
      const res = response.data;
      alert(`${team_name}팀 탈퇴가 완료되었습니다`);
      navigate('/community/team');
    } catch (error) {
      setError(true);
    }
  };

  const handleClickInvite = () => {
    setShowInvite(true);
  };

  const updateTeamInfo = (teamInfo, memberList, tagList) => {
    setThisTeam((prev) => {
      return { ...prev, team: teamInfo };
    });
    setTeamMembers(memberList);
    setTeamTags(tagList);
    if (teamInfo.name !== team_name) {
      navigate(`/community/team/${teamInfo.name}`);
    }
  };

  useEffect(() => {
    if (username !== null) {
      getTeamInfo(1);
    }
  }, [team_name, username]);

  const ArticleList = (articles) => {
    if (inviteId != 0) {
      return (
        <div className={classes.forInvite}>
          <div>팀 게시판은 팀원 승인 후에 이용 가능합니다.</div>
          <div className={classes.inviteMessageLargeBox}>
            <div className={classes.inviteName}>팀 초대를 수락하시겠습니까?</div>
            {/* <div className={classes.inviteMessageSmallBox}>
              <div className={classes.inviteMessage}>ddd</div>
            </div> */}
            <div className={classes.twoButton}>
              <Button
                variant="outline-primary"
                size="sm"
                className="text-dark me-2"
                onClick={() => handleApproveClick(inviteId, myId)}
              >
                수락
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                className="text-dark me-2"
                onClick={() => handleRefuseClick(inviteId, myId)}
              >
                거절
              </Button>
            </div>
          </div>
        </div>
      );
    } else if (articles && articles.articles.length > 0) {
      return articles.articles.map((article) => <TeamArticle key={article.id} article={article} />);
    } else {
      return <h5>작성된 글이 없습니다.</h5>;
    }
  };

  return (
    <>
      <div className="col-9">
        <div className="community-nav d-flex">
          <Button type="button" onClick={onMyTeamList} id="btn-content-back">
            내 팀 목록
          </Button>
          <ul className="nav nav-fill community-nav-items">
            <li className="nav-item selected-nav-item">
              <div>{team_name}</div>
            </li>
          </ul>
          <Button type="button" onClick={onWrite} className="btn btn-primary">
            <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
            작성하기
          </Button>
        </div>
        {!isLoadedArticles && <LoaderIcon style={{ marginTop: '20px' }} />}
        {error && <>{error}</>}
        {isLoadedArticles && !error && (
          <>
            <div className="team">
              <div className="team-left">
                <div className="col-lg-6 col-12 p-2">
                  <img src={server_url + thisTeam.team.image} className="team-profile-img" />
                </div>
                <div className="col-lg-6 col-12 mb-2">
                  <div className="team-desc-header fs-4">
                    {team_name}
                    {isAdmin ? (
                      <EditTeamModal
                        team={thisTeam.team}
                        teamMembers={teamMembers}
                        teamTags={thisTeam.team_tags}
                        updateTeamInfo={updateTeamInfo}
                      />
                    ) : null}
                    <BsBoxArrowRight className="btnIcon team-out" onClick={() => teamOut()} />
                  </div>
                  <div>
                    <div className="inline fs-6">{thisTeam.team.description}</div>
                  </div>
                </div>
                <div>
                  {teamTags.map((t) => (
                    <span key={t.name} className="badge me-2" style={{ backgroundColor: t.color }}>
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="team-right">
                <div className="flex-grow-1">
                  <div className="team-members fs-4 mb-2">
                    Members
                    {!inviteId && (
                      <>
                        <BsPersonPlusFill className="btnIcon" onClick={handleClickInvite} />
                        <InviteTeamModalInBoard
                          show={showInvite}
                          setShow={setShowInvite}
                          team_name={team_name}
                          id={thisTeam.team.id}
                        />
                      </>
                    )}
                  </div>
                  <div className="team-members-box">
                    {teamMembers
                      ? teamMembers.map((member) =>
                          member.is_admin ? (
                            <div key={member.member.user.id} className="dropdown-button text-nowrap">
                              <DropdownButton
                                title={member.member.user.username}
                                variant="link"
                                className="team-members-list"
                              >
                                <Dropdown.Item
                                  onClick={() => {
                                    navigate(`/user/${member.member.user.username}`);
                                  }}
                                >
                                  프로필
                                </Dropdown.Item>
                                {username != member.member.user.username && (
                                  <>
                                    <Dropdown.Item onClick={onChatMessage}>메시지</Dropdown.Item>
                                    <ChatMessageModal_Container
                                      show={showChatMessageModal}
                                      onCloseChatModal={onCloseChatModal}
                                      targetId={member.member.user.id}
                                    />
                                  </>
                                )}
                              </DropdownButton>
                              <BsAwardFill className="admin-star" />
                            </div>
                          ) : (
                            <div key={member.member.user.id} className="dropdown-button text-nowrap">
                              <DropdownButton
                                title={member.member.user.username}
                                variant="link"
                                className="team-members-list"
                                style={{ color: 'grey' }}
                              >
                                <Dropdown.Item
                                  onClick={() => {
                                    navigate(`/user/${member.member.user.username}`);
                                  }}
                                >
                                  프로필
                                </Dropdown.Item>
                                {username != member.member.user.username && (
                                  <>
                                    <Dropdown.Item onClick={onChatMessage}>메시지</Dropdown.Item>
                                    <ChatMessageModal_Container
                                      show={showChatMessageModal}
                                      onCloseChatModal={onCloseChatModal}
                                      targetId={member.member.user.id}
                                    />
                                  </>
                                )}
                              </DropdownButton>
                            </div>
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

            <ArticleList articles={thisTeam.articles} />
            <Pagination
              activePage={nowPage}
              itemsCountPerPage={10}
              totalItemsCount={maxPageNumber * 10}
              pageRangeDisplayed={5}
              onChange={onPageChange}
            ></Pagination>
          </>
        )}
      </div>
    </>
  );
}

export default TeamBoard;
