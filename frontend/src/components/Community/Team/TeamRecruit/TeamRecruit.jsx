import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import CommunityNavItem from '../../Board/CommunityNavItem/index';
import TeamOverview from './TeamOverview';
import RecruitArticle from './RecruitArticle';
import AuthContext from '../../../../utils/auth-context';
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';
import Dropdown from 'react-bootstrap/Dropdown';
import { BsPencilFill } from 'react-icons/bs';

const server_url = import.meta.env.VITE_SERVER_URL;

function TeamRecruit() {
  const navigate = useNavigate();
  const { tabName } = useParams();
  const { username } = useContext(AuthContext);

  const [isLoadedArticles, setIsLoadedArticles] = useState(false);
  const [teams, setTeams] = useState([]);
  const [articles, setArticles] = useState([]);
  const [maxRecruitPage, setMaxRecruitPage] = useState(0);
  const [nowRecruitPage, setNowRecruitPage] = useState(1);
  const [maxTeamPage, setMaxTeamPage] = useState(0);
  const [nowTeamPage, setNowTeamPage] = useState(1);
  const [error, setError] = useState(false);

  const isRecruitTab = tabName === '팀 모집';
  const isTeamListTab = tabName === '전체 팀 목록';

  const [recruitSortOrders, setRecruitSortOrders] = useState('-id');
  const [teamSortOrders, setTeamSortOrders] = useState('-id');

  const recruitSortOptions = [
    { label: '최신 순', value: '-id' },
    { label: '오래된 순', value: 'id' },
    { label: '팀 이름 순', value: 'team_name' },
    { label: '팀원 많은 순', value: '-member_cnt' }
  ];
  const TeamSortOptions = [
    { label: '최신 순', value: '-id' },
    { label: '오래된 순', value: 'id' },
    { label: '이름 순', value: 'name' },
    { label: '팀원 많은 순', value: '-member_cnt' }
  ];

  const [showRecruitDropdown, setShowRecruitDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  const getRecruit = async (page, sort = recruitSortOrders) => {
    try {
      const responseRecruit = await axios.get(
        server_url + `/community/api/board/${tabName}/?page_number=${page}&sort=${sort}`
      );
      const resRecruit = responseRecruit.data;
      if (resRecruit.status === 'success') {
        setArticles(resRecruit.data.articles);
        setMaxRecruitPage(resRecruit.data.max_page_number);
        setIsLoadedArticles(true);
        setNowRecruitPage(page);
      }
    } catch (error) {
      setError(true);
      setIsLoadedArticles(true);
      setArticles([]);
      console.log('getRecruit error', error);
    }
  };
  const getTeamList = async (page, sort = teamSortOrders) => {
    try {
      const responseTeamList = await axios.get(server_url + `/team/api/teams-list/?page_number=${page}&sort=${sort}`);
      const resTeamList = responseTeamList.data;
      if (resTeamList.status === 'success') {
        setTeams(resTeamList.data.teams);
        setMaxTeamPage(resTeamList.data.max_page_number);
        setIsLoadedArticles(true);
        setNowTeamPage(page);
      }
    } catch (error) {
      setError(true);
      setIsLoadedArticles(true);
      setTeams([]);
      console.log('getTeamList error', error);
    }
  };

  useEffect(() => {
    // 존재하는 게시판인지 확인
    if (isRecruitTab) {
      getRecruit(1, recruitSortOrders);
    } else if (isTeamListTab) {
      getTeamList(1, teamSortOrders);
    } else {
      alert('존재하지 않는 게시판입니다.');
    }
  }, [tabName, isRecruitTab, isTeamListTab, recruitSortOrders, teamSortOrders]);

  const onWrite = () => {
    if (username) {
      navigate(`/community/recruit/${tabName}/register`);
    } else {
      if (confirm('로그인이 필요합니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate(`/accounts/login`);
      }
    }
  };

  const onRecruitPageChange = (page) => {
    if (isRecruitTab) {
      getRecruit(page, recruitSortOrders);
      setNowRecruitPage(page);
    }
  };
  const onTeamListPageChange = (page) => {
    if (isTeamListTab) {
      getTeamList(page, teamSortOrders);
      setNowTeamPage(page);
    }
  };

  const handleRecruitSortChange = (sortOption) => {
    setRecruitSortOrders(sortOption.value);
    if (isRecruitTab) {
      getRecruit(nowRecruitPage, sortOption.value);
    }
    setShowRecruitDropdown(false);
  };
  const handleTeamSortChange = (sortOption) => {
    setTeamSortOrders(sortOption.value);
    if (isTeamListTab) {
      getTeamList(nowTeamPage, sortOption.value);
    }
    setShowTeamDropdown(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options).replace(/\.\s/g, '.').replace(/\.$/, '');
  };

  return (
    <div className="col-9">
      {!error && (
        <>
          <div className="community-nav d-flex">
            <ul className="nav nav-fill">
              <CommunityNavItem navName="팀 모집" tabName={tabName} />
              <CommunityNavItem navName="전체 팀 목록" tabName={tabName} />
            </ul>

            <ul className="nav nav-fill">
              {isRecruitTab && (
                <>
                  <Dropdown
                    className="community-dropdown"
                    show={showRecruitDropdown}
                    onToggle={(isOpen) => setShowRecruitDropdown(isOpen)}
                    style={{ marginRight: '5px', fontFamily: 'nanumfont_Bold' }}
                  >
                    <Dropdown.Toggle
                      variant="secondary"
                      style={{ borderRadius: '17px', fontFamily: 'nanumfont_Bold' }}
                      id="dropdown-sort"
                    >
                      {recruitSortOptions.find((option) => option.value === recruitSortOrders).label}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {recruitSortOptions.map((option) => (
                        <Dropdown.Item
                          key={option.value}
                          onClick={() => handleRecruitSortChange(option)}
                          style={{ fontFamily: 'nanumfont_Regular' }}
                        >
                          {option.label}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  <button type="button" onClick={onWrite} className={isRecruitTab ? 'btn-write' : 'btn-write hidden'}>
                    <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
                    작성하기
                  </button>
                </>
              )}
              {isTeamListTab && (
                <Dropdown
                  className="community-dropdown"
                  show={showTeamDropdown}
                  onToggle={(isOpen) => setShowTeamDropdown(isOpen)}
                >
                  <Dropdown.Toggle
                    variant="secondary"
                    style={{ borderRadius: '17px', fontFamily: 'nanumfont_Bold' }}
                    id="dropdown-sort"
                  >
                    {TeamSortOptions.find((option) => option.value === teamSortOrders).label}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {TeamSortOptions.map((option) => (
                      <Dropdown.Item
                        key={option.value}
                        onClick={() => handleTeamSortChange(option)}
                        style={{ fontFamily: 'nanumfont_Regular' }}
                      >
                        {option.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </ul>
          </div>
          {isLoadedArticles ? (
            <>
              {isRecruitTab && (
                <>
                  {articles.map((article) => (
                    <RecruitArticle key={article.id} article={article} pubDate={formatDate(article.pub_date)} />
                  ))}
                  <Pagination
                    activePage={nowRecruitPage}
                    itemsCountPerPage={10}
                    totalItemsCount={maxRecruitPage * 10}
                    pageRangeDisplayed={5}
                    onChange={onRecruitPageChange}
                  />
                </>
              )}
              {isTeamListTab && (
                <>
                  {teams.map((team) => (
                    <TeamOverview key={team.id} team={team} />
                  ))}
                  <Pagination
                    activePage={nowTeamPage}
                    itemsCountPerPage={10}
                    totalItemsCount={maxTeamPage * 10}
                    pageRangeDisplayed={5}
                    onChange={onTeamListPageChange}
                  />
                </>
              )}
            </>
          ) : (
            <LoaderIcon style={{ marginTop: '20px' }} />
          )}
        </>
      )}
      {error && <div>문제가 발생했습니다</div>}
    </div>
  );
}

export default TeamRecruit;
