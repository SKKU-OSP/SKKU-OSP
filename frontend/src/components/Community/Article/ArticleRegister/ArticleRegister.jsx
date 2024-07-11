import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getAuthConfig } from '../../../../utils/auth';
import { EditorModules } from '../editor';
import ReactQuill from 'react-quill';
import { BsChevronLeft, BsPencilFill } from 'react-icons/bs';

import '../../Board/Board.css';

const domainUrl = import.meta.env.VITE_SERVER_URL;

function ArticleRegister({ isWrite, type, consentWriteOpen }) {
  const boardName = useParams().board_name;
  const url = domainUrl + 'community/' + boardName + '/';
  const urlRegistArticle = domainUrl + '/community/api/article/create/';
  const urlTag = domainUrl + '/tag/api/list/';
  const navigate = useNavigate();

  const article = {};
  const [isAuthNotice, setIsAuthNotice] = useState(false);
  const [anonymousWriter, setAnonymousWriter] = useState(false);
  const [team, setTeam] = useState([]);
  const [selectTeam, setSelectTeam] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [articleFiles, setArticleFiles] = useState({});
  const [heroArticleFile, setHeroArticleFile] = useState({});
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [tags, setTags] = useState([]);
  const [selectTags, setSelectTags] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const getCurrentDateTime = () => new Date();
  const [isTeamRegistration, setIsTeamRegistration] = useState(false);
  const [isHero, setIsHero] = useState(false);

  useEffect(() => {
    //axios 사용
    const getTeam = async () => {
      const urlTeam = domainUrl + '/team/api/teams-of-user-list/';
      const responseTeam = await axios.get(urlTeam, getAuthConfig());

      const resTeam = responseTeam.data;
      if (resTeam.status === 'success') {
        setTeam(
          resTeam.data.teams_of_user.map((t) => {
            return {
              value: t.id,
              label: t.name
            };
          })
        );
      } else {
        console.log(resTeam.message);
      }
    };
    const getArticle = async () => {
      try {
        const responseTag = await axios.get(urlTag);
        const resTag = responseTag.data;
        setTags(
          resTag.data.tags.map((t) => {
            return {
              value: t.name,
              label: t.name,
              color: t.color
            };
          })
        );
        if (boardName === '공지') {
          setIsAuthNotice(!isAuthNotice);
        }
      } catch (error) {
        console.error(error);
      }
    };
    getArticle();
    getTeam();
  }, []);

  // 익명 체크 여부 확인
  const anonymousCheck = () => {
    return anonymousWriter;
  };

  // hero 게시글 체크 여부 확인
  const heroCheck = () => {
    return isHero;
  };

  // 저장 버튼 클릭 시
  const handleShow = (event) => {
    event.preventDefault();
    if (boardName === '팀 모집 게시판') {
      if (selectTeam === '') {
        window.alert('모집할 팀을 선택해 주세요');
        return;
      }
      if (!startDate || !endDate) {
        alert('모집 기간을 입력해 주세요');
        return;
      }
      const offset = new Date().getTimezoneOffset() * 60000;
      const period_start_date = startDate.getTime() - offset;
      const period_end_date = endDate.getTime() - offset;

      if (period_start_date > period_end_date - 3600000) {
        window.alert('날짜 입력에 오류가 있습니다. 모집 기간은 최소 1시간이 되도록 설정해 주세요.');
        return;
      }
    }
    if (title.trim() === '') {
      window.alert('제목을 입력해 주세요');
      return;
    } else if (bodyText.trim() === '' || bodyText.trim() === '<p><br></p>') {
      alert('본문을 입력해 주세요');
      return;
    } else if (window.confirm('글을 등록하시겠습니까?')) {
      postArticle();
    }
  };

  const postArticle = async () => {
    try {
      const config = getAuthConfig();
      config.headers['Content-Type'] = 'multipart/form-data';

      const postData = {
        board_name: boardName,
        title: title,
        content: bodyText,
        is_notice: isAuthNotice,
        anonymous_writer: anonymousWriter,
        article_tags: selectTags,
        ...articleFiles,
        ...(boardName === '팀 모집 게시판' && {
          period_start: toKST(startDate).toISOString(),
          period_end: toKST(endDate).toISOString(),
          team_id: selectTeam.value
        }),
        ...(boardName === '홍보' && {
          is_hero: isHero,
          hero_article_file_name: Object.keys(heroArticleFile)[0],
          ...heroArticleFile
        })
      };
      console.log('hero', Object.keys(heroArticleFile)[0]);
      console.log(postData);
      const formData = new FormData();
      Object.entries(postData).forEach(([key, value]) => {
        if (key === 'article_tags') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      console.log(formData);
      const response = await axios.post(urlRegistArticle, formData, getAuthConfig());

      const res = response.data;
      if (res['status'] === 'success') {
        window.alert('등록이 완료되었습니다!');
        navigate(`/community/article/${res.data.article_id}/`);
      } else {
        window.alert(res['message']);
        return;
      }
    } catch (error) {
      console.error('에러:', error);
      window.alert('Error Occured');
    }
  };

  // Title
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  // Body
  const handleBodyChange = (e) => {
    setBodyText(e);
  };

  // File
  const handleFileChange = (event) => {
    const files = event.target.files;
    const all_files = articleFiles;
    var already_exist_files = '';

    for (let i = 0; i < files.length; i++) {
      if (all_files[files[i].name]) {
        if (already_exist_files.length) already_exist_files += ', ' + files[i].name;
        else already_exist_files += files[i].name;
      } else {
        all_files[files[i].name] = files[i];

        var file = document.createElement('div');
        file.id = files[i].name;
        file.classList.add('article-file');
        file.classList.add('d-flex');

        var delete_button = document.createElement('button');
        delete_button.classList.add('article-file-delete-btn');
        delete_button.append('X');
        delete_button.setAttribute('type', 'button');
        delete_button.onclick = function () {
          const all_files2 = articleFiles;
          delete all_files2[files[i].name];
          setArticleFiles(all_files2);
          this.parentElement.parentElement.removeChild(this.parentElement);
        };

        file.append(files[i].name);
        file.appendChild(delete_button);

        document.getElementById('file-list').appendChild(file);
      }
    }
    setArticleFiles(all_files);

    if (already_exist_files.length) {
      window.alert(already_exist_files + ' 파일은 이미 존재합니다.');
    }
  };

  // Hero File
  const handleHeroFileChange = (event) => {
    if (Object.keys(heroArticleFile).length > 0) {
      window.alert('파일은 하나만 선택 가능합니다. 삭제 후 다른 파일을 추가하십시오.');
      return;
    }

    const files = event.target.files[0];
    if (!files) return;
    const all_file = heroArticleFile;
    all_file[files.name] = files;

    var file = document.createElement('div');
    file.id = files.name;
    file.classList.add('article-file');
    file.classList.add('d-flex');

    var delete_button = document.createElement('button');
    delete_button.classList.add('article-file-delete-btn');
    delete_button.append('X');
    delete_button.setAttribute('type', 'button');
    delete_button.onclick = function () {
      delete heroArticleFile[files.name];
      this.parentElement.remove();
      setHeroArticleFile({ ...heroArticleFile });
    };

    file.append(files.name);
    file.appendChild(delete_button);

    document.getElementById('hero-file-list').appendChild(file);
    setHeroArticleFile(all_file);
  };

  // Tag
  const handleOptionSelect = (selectedTags) => {
    if (selectedTags.length <= 5) {
      setSelectTags(selectedTags);
    } else {
      setSelectTags(selectedTags.slice(0, 5));
    }
  };
  const customStyles = {
    control: (provided) => ({
      ...provided,
      height: 'wrap_content',
      margin: '10px 0px',
      borderRadius: '15px'
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? 'lightgray' : 'black',
      background: 'none'
    }),
    multiValue: (provided, state) => {
      const tagColor = state.data.color;

      if (tagColor) {
        const hexColor = tagColor.substring(1);
        const r = parseInt(hexColor.substring(0, 2), 16) & 0xff;
        const g = parseInt(hexColor.substring(2, 4), 16) & 0xff;
        const b = parseInt(hexColor.substring(4, 6), 16) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const fontColor = luma < 127.5 ? 'white' : 'black';

        return {
          ...provided,
          backgroundColor: tagColor,
          color: fontColor
        };
      }
    },
    multiValueLabel: (provided, state) => {
      const tagColor = state.data.color;

      if (tagColor) {
        const hexColor = tagColor.substring(1);
        const r = parseInt(hexColor.substring(0, 2), 16) & 0xff;
        const g = parseInt(hexColor.substring(2, 4), 16) & 0xff;
        const b = parseInt(hexColor.substring(4, 6), 16) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const fontColor = luma < 127.5 ? 'white' : 'black';

        return {
          ...provided,
          backgroundColor: tagColor,
          color: fontColor
        };
      }
    }
  };

  // Team
  const handleOption = (team) => {
    setSelectTeam(team);
    setIsMenuOpen(false);
  };
  const customStyle = {
    control: (provided) => ({
      ...provided,
      height: '45px',
      margin: '2px 0px 10px',
      borderRadius: '15px'
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? 'lightgray' : 'black',
      background: 'none'
    })
  };

  //Team 모집 기간
  const toKST = (date) => {
    const koreaTimezoneOffset = 9 * 60; // KST is UTC+9
    const diff = koreaTimezoneOffset - date.getTimezoneOffset();
    return new Date(date.getTime() + diff * 60 * 1000);
  };

  // 뒤로가기 버튼
  const onBack = () => {
    if (boardName === '팀 모집' || boardName === '전체 팀 목록') {
      navigate(`/community/recruit/${boardName}/`);
    } else if (boardName === '자유' || boardName === '정보' || boardName === '질문' || boardName === '홍보') {
      navigate(`/community/board/${boardName}/`);
    } else {
      navigate(`/community/team/${boardName}/`);
    }
  };

  //정보공개 미동의 시 뜨는 창
  const renderConsentMessage = !isWrite && type === 'register' && (
    <div>
      <p>정보공개에 동의하지 않아 사용할 수 없는 기능입니다.</p>
      <button className="btn btn-primary" onClick={() => consentWriteOpen(request.user.username)}>
        정보공개하기
      </button>
    </div>
  );

  return (
    <>
      {renderConsentMessage}
      <div id="community-main" className="col-md-9">
        <form id="article-form" method="post" data-edit-type={type} encType="multipart/form-data" onSubmit={handleShow}>
          <div className="community-nav d-flex">
            <div>
              <button type="button" className="btn-back" onClick={onBack}>
                <BsChevronLeft style={{ marginRight: '7px', marginBottom: '5px' }} />글 목록
              </button>
            </div>
            <div className="board-name">{boardName} 게시판</div>
            {boardName === '질문' ? (
              <div>
                <div className="anonymous-btn">
                  <input
                    type="checkbox"
                    id="is-anonymous"
                    checked={anonymousCheck()}
                    onChange={() => setAnonymousWriter(!anonymousWriter)}
                  />{' '}
                  <label htmlFor="is-anonymous">익명</label>
                </div>
                <button type="submit" className="btn-write">
                  <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
                  작성하기
                </button>
              </div>
            ) : boardName === '홍보' ? (
              <div>
                <div className="anonymous-btn">
                  <input type="checkbox" id="is-hero" checked={heroCheck()} onChange={() => setIsHero(!isHero)} />{' '}
                  <label htmlFor="is-hero">Hero 게시</label>
                </div>
                <button type="submit" className="btn-write">
                  <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
                  작성하기
                </button>
              </div>
            ) : (
              <button type="submit" className="btn-write">
                <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
                작성하기
              </button>
            )}
          </div>
          <div className="article-design">
            <input
              type="text"
              id="article-title"
              name="title"
              className="form-control"
              value={title}
              placeholder="제목을 입력해 주세요"
              autoFocus
              onChange={handleTitleChange}
            />
            <div className="divider hidden"></div>
            {boardName === '팀 모집' && (
              <>
                {team ? (
                  <Select
                    placeholder={'팀 선택'}
                    options={team}
                    menuPlacement="auto"
                    value={selectTeam}
                    onChange={handleOption}
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    styles={customStyle}
                    className="select-team"
                    onMenuOpen={() => setIsMenuOpen(true)}
                    onMenuClose={() => setIsMenuOpen(false)}
                    menuIsOpen={isMenuOpen}
                  />
                ) : (
                  <>
                    {isTeamRegistration ? (
                      <Select id="team-option" name="team-option" className="form-select pointer">
                        {teamOptions(request.user)}
                      </Select>
                    ) : (
                      <Select
                        placeholder={'팀 추가'}
                        options={options}
                        menuPlacement="auto"
                        value={team}
                        onChange={handleOption}
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        styles={customStyle}
                      />
                    )}
                  </>
                )}
              </>
            )}
            <div className="divider"></div>
            <ReactQuill
              value={bodyText}
              onChange={handleBodyChange}
              modules={EditorModules}
              className="article-body-edit"
            />
            <Select
              placeholder={'Tag'}
              options={tags}
              isMulti
              menuPlacement="auto"
              value={selectTags}
              onChange={handleOptionSelect}
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              styles={customStyles}
            />
            {boardName === '팀 모집' && (
              <div id="period-setting">
                <div className="d-flex">
                  <div id="date-label" className="p-date-label d-flex">
                    모집 기간
                  </div>
                  <div className="row flex-fill">
                    <div className="col-sm-6 d-flex">
                      <div id="date-label" className="p-date-label d-flex">
                        <a>From</a>
                      </div>
                      <div
                        id="PeriodPickerStart"
                        InputGroup
                        className="log-event input-group"
                        data-td-target-input="nearest"
                        data-td-target-toggle="nearest"
                      >
                        <div className="mt-1">
                          <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            fixedHeight
                            dateFormat="MM/dd/yyyy, hh:mm aa"
                            showTimeInput
                            className="form-control"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6 d-flex">
                      <div id="date-label" className="p-date-label d-flex">
                        <a>To</a>
                      </div>
                      <div
                        id="PeriodPickerEnd"
                        InputGroup
                        className="log-event input-group"
                        data-td-target-input="nearest"
                        data-td-target-toggle="nearest"
                      >
                        <div className="mt-1">
                          <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            fixedHeight
                            dateFormat="MM/dd/yyyy, hh:mm aa"
                            minDate={new Date()}
                            showTimeInput
                            className="form-control"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    id="end-button"
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setEndDate(getCurrentDateTime())}
                  >
                    마감
                  </button>
                </div>
              </div>
            )}
            <div className="community-file">
              <input type="file" name="article_files" onChange={handleFileChange} multiple />
              <div id="file-list"></div>
            </div>
            {boardName === '홍보' && isHero && (
              <div className="community-file">
                <div style={{ display: 'flex' }}>
                  <div style={{ color: '#000000', marginRight: '10px' }}>Hero 게시용 썸네일</div>
                  <input type="file" name="hero_article_files" onChange={handleHeroFileChange} multiple />
                </div>
                <div id="hero-file-list"></div>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

export default ArticleRegister;
