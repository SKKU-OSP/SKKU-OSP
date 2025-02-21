import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import CommunityNavItem from '../../Board/CommunityNavItem/index';
import TeamOverview from './TeamOverview';
import RecruitArticle from './RecruitArticle';
import AuthContext from '../../../../utils/auth-context';
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';
import Dropdown from 'react-bootstrap/Dropdown';
import { BsPencilFill } from 'react-icons/bs';

// api 레이어 분리 작업
import { useRecruitStore, useTeamStore } from '../../../../stores/team/teamRecuitStore';
import { useBoardList } from '../../../../api/reactQuery/teamRecruit/useBoardList';
import { useTeamList } from '../../../../api/reactQuery/teamRecruit/useTeamLIst';

function TeamRecruit() {
  const navigate = useNavigate();
  const { tabName } = useParams();
  const { username } = useContext(AuthContext);

  const isRecruitTab = tabName === '팀 모집';
  const isTeamListTab = tabName === '전체 팀 목록';

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

  //   const getRecruit = async (page, sort = recruitSortOrders) => {
  //     try {
  //       const responseRecruit = await axios.get(
  //         server_url + `/community/api/board/${tabName}/?page_number=${page}&sort=${sort}`
  //       );
  //       const resRecruit = responseRecruit.data;
  //       console.log(resRecruit);
  //       if (resRecruit.status === 'success') {
  //         setArticles(resRecruit.data.articles);
  //         setMaxRecruitPage(resRecruit.data.max_page_number);
  //         setIsLoadedArticles(true);
  //         setNowRecruitPage(page);
  //       }
  //     } catch (error) {
  //       setError(true);
  //       setIsLoadedArticles(true);
  //       setArticles([]);
  //       console.log('getRecruit error', error);
  //     }
  //   };
  //   const getTeamList = async (page, sort = teamSortOrders) => {
  //     try {
  //       const responseTeamList = await axios.get(server_url + `/team/api/teams-list/?page_number=${page}&sort=${sort}`);
  //       const resTeamList = responseTeamList.data;
  //       console.log(resTeamList);
  //       if (resTeamList.status === 'success') {
  //         setTeams(resTeamList.data.teams);
  //         setMaxTeamPage(resTeamList.data.max_page_number);
  //         setIsLoadedArticles(true);
  //         setNowTeamPage(page);
  //       }
  //     } catch (error) {
  //       setError(true);
  //       setIsLoadedArticles(true);
  //       setTeams([]);
  //       console.log('getTeamList error', error);
  //     }
  //   };

  //   useEffect(() => {
  //     // 존재하는 게시판인지 확인
  //     if (isRecruitTab) {
  //       getRecruit(1, recruitSortOrders);
  //     } else if (isTeamListTab) {
  //       getTeamList(1, teamSortOrders);
  //     } else {
  //       alert('존재하지 않는 게시판입니다.');
  //     }
  //   }, [tabName, isRecruitTab, isTeamListTab, recruitSortOrders, teamSortOrders]);

  const onWrite = () => {
    if (username) {
      navigate(`/community/recruit/${tabName}/register`);
    } else {
      if (confirm('로그인이 필요합니다. 로그인 화면으로 이동하시겠습니까?')) {
        navigate(`/accounts/login`);
      }
    }
  };

  //   const onRecruitPageChange = (page) => {
  //     if (isRecruitTab) {
  //       getRecruit(page, recruitSortOrders);
  //       setNowRecruitPage(page);
  //     }
  //   };
  //   const onTeamListPageChange = (page) => {
  //     if (isTeamListTab) {
  //       getTeamList(page, teamSortOrders);
  //       setNowTeamPage(page);
  //     }
  //   };

  //   const handleRecruitSortChange = (sortOption) => {
  //     setRecruitSortOrders(sortOption.value);
  //     if (isRecruitTab) {
  //       getRecruit(nowRecruitPage, sortOption.value);
  //     }
  //     setShowRecruitDropdown(false);
  //   };
  //   const handleTeamSortChange = (sortOption) => {
  //     setTeamSortOrders(sortOption.value);
  //     if (isTeamListTab) {
  //       getTeamList(nowTeamPage, sortOption.value);
  //     }
  //     setShowTeamDropdown(false);
  //   };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options).replace(/\.\s/g, '.').replace(/\.$/, '');
  };

  // 클라이언트 상태
  const { recruitPage, showRecruitDropdown, recruitSortOrders } = useRecruitStore();
  const { teamPage, showTeamDropdown, teamSortOrders } = useTeamStore();

  // 클라이언트 상태 제어
  const { setRecruitPage, setShowRecruitDropdown, setRecruitSortOrders } = useRecruitStore();
  const { setTeamPage, setShowTeamDropdown, setTeamSortOrders } = useTeamStore();

  // 서버 상태 fetch
  const {
    data: { articles, max_page_number: maxRecruitPage },
    isLoading: isArticleLoading
  } = useBoardList(tabName, recruitPage, recruitSortOrders);

  const {
    data: { teams, max_page_number: maxTeamPage },
    isLoading: isTeamLoading
  } = useTeamList(teamPage, teamSortOrders);

  console.log('articles:', articles);

  // 로딩 상태
  if (isArticleLoading || isTeamLoading) {
    return <LoaderIcon style={{ marginTop: '20px' }} />;
  }

  return (
    <div className="col-9">
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
                        onClick={() => setRecruitSortOrders(option.value)}
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
                      onClick={() => setTeamSortOrders(option.value)}
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
        <>
          {isRecruitTab && (
            <>
              {articles.map((article) => (
                <RecruitArticle key={article.id} article={article} pubDate={formatDate(article.pub_date)} />
              ))}
              <Pagination
                activePage={recruitPage}
                itemsCountPerPage={10}
                totalItemsCount={maxRecruitPage * 10}
                pageRangeDisplayed={5}
                onChange={setRecruitPage}
              />
            </>
          )}
          {isTeamListTab && (
            <>
              {teams.map((team) => (
                <TeamOverview key={team.id} team={team} />
              ))}
              <Pagination
                activePage={teamPage}
                itemsCountPerPage={10}
                totalItemsCount={maxTeamPage * 10}
                pageRangeDisplayed={5}
                onChange={setTeamPage}
              />
            </>
          )}
        </>
      </>
    </div>
  );
}

export default TeamRecruit;
