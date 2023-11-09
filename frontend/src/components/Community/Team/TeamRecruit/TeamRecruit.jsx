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

  const [sortOrder, setSortOrder] = useState('-id');

  const sortOptions = [
    { label: '최신순', value: '-id' },
    { label: '오래된 순', value: 'id' },
    { label: '이름 순', value: 'name' },
    { label: '팀원 많은 순', value: '-member_cnt' }
  ];

  const getRecruit = async (page, sort = 'latest') => {
    try {
      const responseRecruit = await axios.get(server_url + `/community/api/board/${tabName}/?page_number=${page}`);
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
  const getTeamList = async (page, sort = sortOrder) => {
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
      setArticles([]);
      console.log('getTeamList error', error);
    }
  };

  useEffect(() => {
    // 존재하는 게시판인지 확인
    if (isRecruitTab) {
      getRecruit(1);
    } else if (isTeamListTab) {
      getTeamList(1, sortOrder);
    } else {
      alert('존재하지 않는 게시판입니다.');
    }
  }, [tabName, isRecruitTab, isTeamListTab, sortOrder]);

  const onWrite = () => {
    if (username) {
      navigate(`/community/board/${tabName}/register`);
    } else {
      if (confirm('로그인이 필요합니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate(`/accounts/login`);
      }
    }
  };

  const onRecruitPageChange = (page) => {
    if (isRecruitTab) {
      getRecruit(page);
    }
  };

  const onTeamListPageChange = (page) => {
    if (isTeamListTab) {
      getTeamList(page, sortOrder);
      setNowTeamPage(page);
    }
  };

  const handleSortChange = (sortOption) => {
    setSortOrder(sortOption.value);
    if (isTeamListTab) {
      getTeamList(nowTeamPage, sortOption.value);
    }
  };

  return (
    <div className="col-9">
      {!error && (
        <>
          <div className="community-nav d-flex">
            {isRecruitTab && (
              <button type="button" className="btn btn-primary hidden">
                hidden
              </button>
            )}
            {isTeamListTab && (
              <Dropdown>
                <Dropdown.Toggle variant="secondary" id="dropdown-sort">
                  {sortOptions.find((option) => option.value === sortOrder).label}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {sortOptions.map((option) => (
                    <Dropdown.Item key={option.value} onClick={() => handleSortChange(option)}>
                      {option.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}
            <ul className="nav nav-fill community-nav-items">
              <CommunityNavItem navName="팀 모집" tabName={tabName} />
              <CommunityNavItem navName="전체 팀 목록" tabName={tabName} />
            </ul>
            <button
              type="button"
              onClick={onWrite}
              className={isRecruitTab ? 'btn btn-primary' : 'btn btn-primary hidden'}
            >
              작성하기
            </button>
          </div>
          {isLoadedArticles ? (
            <>
              {isRecruitTab && (
                <>
                  {articles.map((article) => (
                    <RecruitArticle key={article.id} article={article} />
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
