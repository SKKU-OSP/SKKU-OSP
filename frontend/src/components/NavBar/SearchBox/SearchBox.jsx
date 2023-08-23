import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { BsSearch, BsHash } from 'react-icons/bs';
import './SearchBox.css';

function SearcherBox() {
  const [curBoard, setCurBoard] = useState({ label: '질문', value: 1 });
  const [normalBoards, setNormalBoards] = useState([
    { label: '팀 모집', value: 2 },
    { label: '정보', value: 5 },
    { label: '홍보', value: 6 }
  ]);
  const [teamBoards, setTeamBoards] = useState([
    { label: 'Team1', value: 9 },
    { label: 'SOSD 베타 테스팅', value: 52 }
  ]);
  const [fieldData, setFieldData] = useState([{ label: '전체', value: 0 }]);
  const [tagData, setTagData] = useState([{ type: 'tool', label: '태그이름', value: '태그이름' }]);
  const [keyword, setKeyword] = useState('');

  const navigate = useNavigate();

  const searchArticle = () => {
    if (keyword !== '') {
      navigate('/community/search', {
        state: {
          keyword: keyword
        }
      });
      setKeyword('');
    }
  };

  useEffect(() => {
    // axios 들어갈 자리
    setFieldData([...fieldData, ...normalBoards, ...teamBoards]);
  }, []);

  const handleSeletBoard = (e) => {
    console.log('handleSeletBoard', e);
  };

  const handleSeletTag = (e) => {
    console.log('handleSeletBoard', e);
  };

  const handleToggleTag = () => {
    console.log('handleToggleTag');
  };

  const handleKeyword = (e) => {
    console.log('handleKeyword', e.target.value);
    setKeyword(e.target.value);
  };

  return (
    <div className="searchBox">
      <div className="search">
        <input
          type="text"
          id="search-word"
          className="form-control"
          value={keyword}
          placeholder="검색"
          aria-describedby="search-btn"
          onChange={(e) => handleKeyword(e)}
        />
        <BsHash className="hash-icon" size="24" />
        <BsSearch className="search-icon" onClick={() => searchArticle()} />
      </div>
    </div>
  );
}

export default SearcherBox;
