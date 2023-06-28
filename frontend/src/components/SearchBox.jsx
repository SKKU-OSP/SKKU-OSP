import { useState, useEffect } from 'react';
import Select from 'react-select';
import classes from './SearchBox.module.css';

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
    <div className={classes.searchBox}>
      <div className="d-flex justify-content-between shadow-sm rounded-2">
        <div className="input-group text-nowrap">
          <Select options={fieldData} value={curBoard} onChange={(e) => handleSeletBoard(e)} />
          <input
            type="text"
            id="search-word"
            className="form-control"
            value={keyword}
            placeholder="제목/본문 검색어"
            aria-describedby="search-btn"
            onChange={(e) => handleKeyword(e)}
          />
          <button
            type="button"
            id="tag-btn"
            className="btn btn-light"
            onClick={handleToggleTag}
            data-bs-hover="tooltip"
            data-bs-placement="bottom"
            data-bs-title="태그 검색"
          >
            #
          </button>
          <button type="button" className={classes.searchBtn}>
            검색
          </button>
        </div>
      </div>
      <div id="tag-filter" className={`fade ${classes.tagFilter}`}>
        <Select options={tagData} value="1" onChange={(e) => handleSeletTag(e)} multiple />
      </div>
    </div>
  );
}

export default SearcherBox;
