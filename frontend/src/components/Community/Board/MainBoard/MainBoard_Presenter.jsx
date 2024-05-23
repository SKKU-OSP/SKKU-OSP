import '../../Community.css';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniBoardArticle from '../MiniBoardArticle/index';
import RecruitArticle from '../MiniBoardTeamRecruit/index';
import TeamList from '../MiniBoardTeamList/index';
import LoaderIcon from 'react-loader-icon';
import { BsChevronCompactLeft, BsChevronCompactRight, BsFillPlusCircleFill } from 'react-icons/bs';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function Board_Presenter(props) {
  const { currentPage, promotionImages, handlePrevClick, handleNextClick, renderPageIndicators, renderImages } = props;

  const navigate = useNavigate();
  const [isLoadedArticles, setIsLoadedArticles] = useState(false);
  const [articles, setArticles] = useState([]);
  const [recruitArticles, setRecruitArticles] = useState([]);
  const [teamLists, setTeamLists] = useState([]);
  const [error, setError] = useState(false);
  const [selectedTab1, setSelectedTab1] = useState('홍보');
  const [selectedTab2, setSelectedTab2] = useState('팀 모집');
  const backgroundImage = promotionImages[currentPage];
  console.log('image', backgroundImage);

  const getArticles = async (page) => {
    try {
      const response = await axios.get(server_url + `/community/api/board/${selectedTab1}/?page_number=${page}`);
      const res = response.data;
      if (res.status === 'success') {
        setArticles(res.data.articles);
        setIsLoadedArticles(true);
      } else {
        alert('해당 게시판이 존재하지 않습니다.');
        navigate('/community');
      }
    } catch (error) {
      setError(true);
      setIsLoadedArticles(true);
      setArticles([]);
    }
  };

  const getRecruitArticles = async (page) => {
    try {
      const response = await axios.get(server_url + `/community/api/board/${selectedTab2}/?page_number=${page}`);
      const res = response.data;
      if (res.status === 'success') {
        setRecruitArticles(res.data.articles);
        setIsLoadedArticles(true);
      } else {
        alert('해당 게시판이 존재하지 않습니다.');
        navigate('/community');
      }
    } catch (error) {
      setError(true);
      setIsLoadedArticles(true);
      setRecruitArticles([]);
    }
  };

  const getTeamLists = async () => {
    try {
      const response = await axios.get(server_url + `/team/api/teams-list/`);
      const res = response.data;
      if (res.status === 'success') {
        setTeamLists(res.data.teams);
        setIsLoadedArticles(true);
      } else {
        alert('해당 게시판이 존재하지 않습니다.');
        navigate('/community');
      }
    } catch (error) {
      setError(true);
      setIsLoadedArticles(true);
      setTeamLists([]);
    }
  };

  useEffect(() => {
    getArticles(1);
    if (selectedTab2 === '팀 모집') {
      getRecruitArticles(1);
    } else {
      getTeamLists(1);
    }
  }, [selectedTab1, selectedTab2]);

  const handleTabClick1 = (tabName) => {
    setSelectedTab1(tabName);
  };

  const handleTabClick2 = (tabName) => {
    setSelectedTab2(tabName);
  };

  const onCommunity = () => {
    navigate(`/community/board/자유`);
  };

  const onRecruit = () => {
    navigate(`/community/recruit/팀 모집`);
  };

  const onImageClick = () => {
    navigate(`/community/article/${backgroundImage.id}`);
  };

  return (
    <div className="col-9">
      {promotionImages.length > 0 ? (
        <div
          className="community-hero"
          style={{
            backgroundImage: `url(${backgroundImage.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={onImageClick}
        >
          <BsChevronCompactLeft
            className="icon"
            size={30}
            onClick={(e) => {
              e.stopPropagation();
              handlePrevClick();
            }}
          />
          <div className="page-indicators">{renderPageIndicators(currentPage)}</div>
          <BsChevronCompactRight
            className="icon"
            size={30}
            onClick={(e) => {
              e.stopPropagation();
              handleNextClick();
            }}
          />
        </div>
      ) : (
        <div className="community-hero">
          <p>Loading images...</p>
        </div>
      )}

      <div className="d-flex">
        <div className="board-left">
          <div className="board-nav">
            <div onClick={onCommunity}>커뮤니티</div>
            <BsFillPlusCircleFill size={20} onClick={onCommunity} style={{ color: '575757' }} />
          </div>
          <div>
            <ul className="nav" style={{ marginLeft: '15px' }}>
              <li
                className={`board-nav-item ${
                  selectedTab1 === '홍보' ? 'selected-board-nav-item' : 'unselected-board-nav-item'
                }`}
                onClick={() => handleTabClick1('홍보')}
              >
                <div>홍보</div>
              </li>
              <li
                className={`board-nav-item ${
                  selectedTab1 === '자유' ? 'selected-board-nav-item' : 'unselected-board-nav-item'
                }`}
                onClick={() => handleTabClick1('자유')}
              >
                <div>자유</div>
              </li>
              <li
                className={`board-nav-item ${
                  selectedTab1 === '질문' ? 'selected-board-nav-item' : 'unselected-board-nav-item'
                }`}
                onClick={() => handleTabClick1('질문')}
              >
                <div>질문</div>
              </li>
              <li
                className={`board-nav-item ${
                  selectedTab1 === '정보' ? 'selected-board-nav-item' : 'unselected-board-nav-item'
                }`}
                onClick={() => handleTabClick1('정보')}
              >
                <div>정보</div>
              </li>
            </ul>
          </div>
          <div className="divider" style={{ margin: '5px 20px 10px' }}></div>
          {isLoadedArticles ? (
            <>
              {articles.length ? (
                articles.slice(0, 5).map((article) => <MiniBoardArticle key={article.id} article={article} />)
              ) : (
                <MiniBoardArticle article={{}} />
              )}
            </>
          ) : (
            <LoaderIcon style={{ marginTop: '20px' }} />
          )}
        </div>
        <div className="board-right">
          <div className="board-nav">
            <div onClick={onRecruit}>팀 모집</div>
            <BsFillPlusCircleFill size={20} onClick={onRecruit} style={{ color: '575757' }} />
          </div>
          <div>
            <ul className="nav" style={{ marginLeft: '15px' }}>
              <li
                className={`board-nav-item ${
                  selectedTab2 === '팀 모집' ? 'selected-board-nav-item' : 'unselected-board-nav-item'
                }`}
                onClick={() => handleTabClick2('팀 모집')}
              >
                <div>팀 모집</div>
              </li>
              <li
                className={`board-nav-item ${
                  selectedTab2 === '전체 팀 목록' ? 'selected-board-nav-item' : 'unselected-board-nav-item'
                }`}
                onClick={() => handleTabClick2('전체 팀 목록')}
              >
                <div>전체 팀 목록</div>
              </li>
            </ul>
          </div>
          <div className="divider" style={{ margin: '5px 20px 10px' }}></div>
          {isLoadedArticles ? (
            <>
              {selectedTab2 === '팀 모집' ? (
                <>
                  {recruitArticles.slice(0, 5).map((article) => (
                    <RecruitArticle article={article} />
                  ))}
                </>
              ) : (
                <>
                  {teamLists.slice(0, 5).map((team) => (
                    <TeamList team={team} />
                  ))}
                </>
              )}
            </>
          ) : (
            <LoaderIcon style={{ marginTop: '20px' }} />
          )}
        </div>
      </div>
    </div>
  );
}
